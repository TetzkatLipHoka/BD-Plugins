/**
 * @name ToastNotifications
 * @author Skully, Ethan, Buzzy (Equicord) · BD-Port
 * @version 1.0.1
 * @description Zeigt eingehende Nachrichten als Toast-Popup in Discord – konfigurierbar für DMs, Gruppen, Freunde und Server-Kanäle. Linksklick springt hin, Rechtsklick markiert als gelesen. Port des Equicord-Plugins.
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/toastNotifications
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ToastNotifications/ToastNotifications.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — basiert auf Equicord-Code */
"use strict";

//#region Updater — UpdateManager © Pharaoh2k, used with permission (see THIRD_PARTY_NOTICES.md)
const UpdateManager = (({ Net, UI, Logger, Data, Plugins, Utils }) => class UpdateManager {
    /* using Net, UI, Logger, Data, Plugins, Utils from BdApi */
    constructor(pluginName, version, github) {
        this.name = pluginName;
        this.version = version;
        const [user, repo] = github.split('/');
        this.urls = {
            plugin: `https://raw.githubusercontent.com/${user}/${repo}/main/Plugins/${pluginName}/${pluginName}.plugin.js`,
            changelog: `https://raw.githubusercontent.com/${user}/${repo}/main/Plugins/${pluginName}/CHANGELOG.md`
        };
        this.timer = null;
        this.notification = null;
        this._initialTimeout = null;
    }
    start(autoUpdate = true) {
        this.stop();
        if (autoUpdate) {
            this._initialTimeout = setTimeout(() => this.check(true), 15000);
            this.timer = setInterval(() => this.check(true), 24 * 60 * 60 * 1000);
        }
        this.showChangelog();
    }
    stop() {
        clearTimeout(this._initialTimeout);
        this._initialTimeout = null;
        clearInterval(this.timer);
        this.timer = null;
        this._closeNotification();
    }
    _closeNotification() {
        if (!this.notification) return;
        if (typeof this.notification === "function") this.notification();
        else if (this.notification.close) this.notification.close();
        this.notification = null;
    }
    async check(silent = false) {
        try {
            const res = await Net.fetch(this.urls.plugin);
            if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            const validated = this._validateRemotePluginText(text);
            if (!validated.ok) throw new Error(`Remote plugin validation failed: ${validated.reason}`);
            const version = validated.version;
            if (this.isNewer(version)) {
                this.showUpdateNotice(version, text);
            } else if (!silent) {
                UI.showToast(`[${this.name}] You're up to date.`, { type: "info" });
            }
        } catch (e) {
            Logger.error("Update check failed:", e);
            if (!silent) UI.showToast(`[${this.name}] Update check failed`, { type: "error" });
        }
    }
    showUpdateNotice(version, text) {
        this._closeNotification();
        const handle = UI.showNotification({
            id: `bd-plugin-update:${this.name}`,
            title: this.name,
            content: `v${version} is available`,
            type: "info",
            duration: 6000000,
            actions: [
                {
                    label: "Update",
                    onClick: () => {
                        this._closeNotification();
                        this.applyUpdate(text);
                    },
                },
                {
                    label: "Dismiss",
                    onClick: () => this._closeNotification(),
                },
            ],
            onClose: () => {
                if (this.notification === handle) this.notification = null;
            },
        });
        this.notification = handle;
    }
    applyUpdate(text) {
        try {
            const validated = this._validateRemotePluginText(text);
            if (!validated.ok) {
                UI.showToast(`[${this.name}] Update blocked: ${validated.reason}`, { type: "error", timeout: 8000 });
                return;
            }
            const nextVersion = validated.version;
            const nodePath = require("path");
            const updateTarget = nodePath.join(__dirname, nodePath.basename(__filename));
            require("fs").writeFileSync(updateTarget, text);
            UI.showToast(`[${this.name}] Updated to v${nextVersion}. Reloading...`, { type: "success" });
            setTimeout(() => {
                try {
                    Plugins.reload(this.name);
                } catch {
                    UI.showToast(`[${this.name}] Please reload Discord (Ctrl+R)`, { type: "info", timeout: 0 });
                }
            }, 100);
        } catch (e) {
            Logger.error("Update failed:", e);
            UI.showToast(`[${this.name}] Update failed`, { type: "error" });
        }
    }
    async showChangelog() {
        const last = Data.load("version");
        Logger.info(`showChangelog: last=${last}, current=${this.version}`);
        if (last === this.version) { Logger.info("Skipping: versions match"); return; }
        Data.save("version", this.version);
        if (!last) { Logger.info("Skipping: fresh install"); return; }
        try {
            const res = await Net.fetch(this.urls.changelog);
            Logger.info(`Changelog fetch status: ${res.status}`);
            if (res.status !== 200) return;
            const md = await res.text();
            const changes = this.parseChangelog(md, last, this.version);
            Logger.info("Parsed changes:", changes);
            if (changes.length === 0) return;
            UI.showChangelogModal({ title: this.name, subtitle: `Version ${this.version}`, changes });
        } catch (e) { Logger.error("Changelog error:", e); }
    }
    async showFullChangelog() {
        try {
            const res = await Net.fetch(this.urls.changelog);
            if (res.status !== 200) throw new Error("Failed to fetch changelog");
            const md = await res.text();
            const changes = this.parseChangelog(md, "0.0.0", this.version);
            UI.showChangelogModal({
                title: this.name,
                subtitle: `All Changes`,
                changes: changes.length ? changes : [{ title: "No changes found", items: [] }]
            });
        } catch {
            UI.showToast("Could not fetch changelog", { type: "error" });
        }
    }
    parseChangelog(md, from, to) {
        const versions = this._parseChangelogVersions(md);
        const relevant = versions.filter(
            v => this.isNewer(v.version, from) && !this.isNewer(v.version, to)
        );
        const getType = (lower) => {
            if (lower.includes("fix")) return "fixed";
            if (lower.includes("add") || lower.includes("initial")) return "added";
            if (lower.includes("improv") || lower.includes("updat")) return "improved";
            return "other";
        };
        const sections = [
            ["New Features", "added", "added"],
            ["Improvements", "improved", "improved"],
            ["Bug Fixes", "fixed", "fixed"],
            ["Other Changes", "other", "progress"]
        ];
        const result = [];
        for (const v of relevant) {
            const grouped = { added: [], improved: [], fixed: [], other: [] };
            for (const item of v.items) {
                grouped[getType(item.toLowerCase())].push(item);
            }
            result.push({ title: `Version ${v.version}`, type: "", items: [] });
            for (const [title, key, type] of sections) {
                if (grouped[key].length) {
                    result.push({ title, type, items: grouped[key] });
                }
            }
        }
        return result;
    }
    _parseChangelogVersions(md) {
        const lines = md.split("\n");
        const versions = [];
        let current = null;
        let items = [];
        const push = () => {
            if (!current) return;
            versions.push({ version: current, items });
            items = [];
        };
        for (const line of lines) {
            const ver = line.match(/^###\s+([\d.]+)/)?.[1];
            if (ver) {
                push();
                current = ver;
                continue;
            }
            if (!current) continue;
            const trimmed = line.trim();
            if (!trimmed.startsWith("-")) continue;
            const item = trimmed.substring(1).trim();
            if (item) items.push(item);
        }
        push();
        return versions;
    }
    isNewer(remoteVersion, localVersion = this.version) {
        return Utils.semverCompare(localVersion, remoteVersion) > 0;
    }
    _validateRemotePluginText(text) {
        if (typeof text !== "string") return { ok: false, reason: "Not a string" };
        if (text.length < 800) return { ok: false, reason: "File too small" };
        const remoteName = /@name\s+([^\n\r]+)/.exec(text)?.[1]?.trim();
        if (!remoteName) return { ok: false, reason: "Missing @name" };
        if (remoteName !== this.name) return { ok: false, reason: `Unexpected @name (${remoteName})` };
        const remoteVersion = /@version\s+([\d.]+)/.exec(text)?.[1];
        if (!remoteVersion) return { ok: false, reason: "Missing @version" };
        if (!text.includes("module.exports")) return { ok: false, reason: "Missing module.exports" };
        if (!text.includes("@updateUrl")) return { ok: false, reason: "Missing @updateUrl header" };
        return { ok: true, version: remoteVersion };
    }
})(new BdApi("ToastNotifications"));
//#endregion Updater

const { Webpack, React, ReactDOM, DOM, Data, UI, Logger } = new BdApi("ToastNotifications");
const { Filters } = Webpack;
const { useState, useEffect, useRef } = React;

const ID_REGEX = /^\d{17,20}$/;
const P = "bd-toast-";

const DEFAULTS = {
    position: "bottom-left",
    timeout: 5,
    opacity: 100,
    maxNotifications: 3,
    disableInStreamerMode: true,
    respectDoNotDisturb: false,
    directMessages: true,
    groupMessages: true,
    friendServerNotifications: true,
    ignoreUsers: "",
    notifyFor: ""
};

// UserNotificationSetting: 0 = ALL_MESSAGES, 1 = ONLY_MENTIONS, 2 = NO_MESSAGES, 3 = NULL (erben)
const NOTIFY = { ALL: 0, MENTIONS: 1, NONE: 2 };

const CSS = `
:root {
  --${P}bg: var(--background-base-low, var(--background-floating, #2b2d31));
  --${P}text: var(--text-default, var(--text-normal));
  --${P}title: var(--text-strong, var(--header-primary));
  --${P}offset: 1rem;
}
#${P}container { position: fixed; z-index: 2147483647; display: flex; gap: .75rem; pointer-events: none; max-height: calc(100vh - var(--${P}offset) * 2); }
#${P}container.${P}pos-bottom-left, #${P}container.${P}pos-bottom-right { flex-direction: column; justify-content: flex-end; }
#${P}container.${P}pos-top-left, #${P}container.${P}pos-top-right { flex-direction: column-reverse; justify-content: flex-start; }
#${P}container.${P}pos-bottom-left { bottom: var(--${P}offset); left: var(--${P}offset); }
#${P}container.${P}pos-top-left { top: var(--${P}offset); left: var(--${P}offset); }
#${P}container.${P}pos-top-right { top: var(--${P}offset); right: var(--${P}offset); }
#${P}container.${P}pos-bottom-right { bottom: var(--${P}offset); right: var(--${P}offset); }
.${P}root { all: unset; pointer-events: auto; position: relative; display: flex; flex-direction: column; color: var(--${P}text);
  background: var(--${P}bg); border-radius: 8px; overflow: hidden; cursor: pointer; min-width: 25rem; max-width: 50vw; max-height: 50vh;
  flex-shrink: 0; box-shadow: var(--shadow-high, 0 8px 16px rgba(0,0,0,.24)); }
.${P}content { display: flex; flex-direction: column; padding: 1rem .2rem; width: 100%; overflow: hidden; }
.${P}header { display: flex; align-items: center; gap: .5rem; color: var(--${P}title); font-size: 1rem; font-weight: 600; line-height: 1.25rem; padding: 0 .8rem .5rem; }
.${P}header img { width: 1.5rem; height: 1.5rem; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.${P}header-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.${P}sep { color: var(--text-muted); font-weight: 400; }
.${P}chan { color: var(--text-muted); font-weight: 500; }
.${P}system { display: flex; padding: 1rem; gap: 1.25rem; width: 100%; }
.${P}system img { height: 4rem; width: 4rem; border-radius: 6px; }
.${P}title { color: var(--${P}title); font-size: 1rem; font-weight: 600; margin: 0; }
.${P}p { margin: .5rem 0 3px; line-height: 140%; overflow-wrap: anywhere; }
.${P}close { all: unset; cursor: pointer; color: var(--interactive-normal); opacity: .5; position: absolute; top: .4rem; right: .4rem; z-index: 1;
  width: 1.5rem; height: 1.5rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--${P}bg); }
.${P}close:hover { opacity: 1; color: var(--interactive-hover); }
.${P}close svg { width: 1.25rem; height: 1.25rem; }
.${P}progress { height: .25rem; background: var(--brand-500, #5865f2); border-radius: 5px; margin-top: auto; }
.${P}fallback { display: flex; gap: .75rem; padding: 0 .8rem; }
.${P}fallback img { width: 2.5rem; height: 2.5rem; border-radius: 50%; }
.${P}fallback b { color: var(--${P}title); }
`;

class Boundary extends React.Component {
    constructor(p) { super(p); this.state = { err: false }; }
    static getDerivedStateFromError() { return { err: true }; }
    componentDidCatch(e) { Logger.error("Toast render error", e); this.props.onError?.(); }
    render() { return this.state.err ? null : this.props.children; }
}

module.exports = class ToastNotifications {
    constructor() { this.queue = []; this.nextId = 0; }

    get s() { return Object.assign({}, DEFAULTS, Data.load("settings")); }
    set(key, value) { Data.save("settings", { ...this.s, [key]: value }); }

    parseIds(str) { return (str || "").replace(/\s/g, "").split(",").filter(id => ID_REGEX.test(id)); }

    start() {
        this.__updater = new UpdateManager("ToastNotifications", BdApi.Plugins.get("ToastNotifications")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        const S = n => Webpack.getStore(n);
        this.ChannelStore = S("ChannelStore");
        this.UserStore = S("UserStore");
        this.SelectedChannelStore = S("SelectedChannelStore");
        this.PresenceStore = S("PresenceStore");
        this.StreamerModeStore = S("StreamerModeStore");
        this.UserGuildSettingsStore = S("UserGuildSettingsStore");
        this.RelationshipStore = S("RelationshipStore");
        this.MessageStore = S("MessageStore");
        this.GuildStore = S("GuildStore");

        this.Dispatcher = Webpack.getModule(Filters.byKeys("dispatch", "subscribe"), { searchExports: true });
        this.IconUtils = Webpack.getModule(Filters.byKeys("getUserAvatarURL", "getGuildIconURL"), { searchExports: true });
        this.PrivateChannelActions = Webpack.getModule(Filters.byKeys("selectPrivateChannel"));
        this.RTCActions = Webpack.getModule(Filters.byKeys("updateChatOpen", "toggleParticipants"));
        this.transitionTo = Webpack.getModule(Filters.byStrings("transitionTo - Transitioning to"), { searchExports: true });
        this.MessageComponent = Webpack.getModule(m => {
            const f = typeof m === "function" ? m : (m?.type ?? m?.render);
            if (typeof f !== "function") return false;
            const src = String(f);
            return src.includes("childrenExecutedCommand:") && src.includes(".hideAccessories");
        }, { searchExports: true });
        this.createRoot = ReactDOM?.createRoot ?? Webpack.getModule(Filters.byKeys("createRoot"))?.createRoot;

        if (!this.Dispatcher || !this.createRoot) {
            UI.showToast("ToastNotifications: Dispatcher/ReactDOM nicht gefunden", { type: "error" });
            return Logger.error("Missing", { Dispatcher: !!this.Dispatcher, createRoot: !!this.createRoot });
        }
        if (!this.MessageComponent) Logger.warn("MessageComponent nicht gefunden – nutze einfache Darstellung");

        this.onMessage = e => { try { this.handleMessage(e); } catch (err) { Logger.error(err); } };
        this.Dispatcher.subscribe("MESSAGE_CREATE", this.onMessage);
    }

    stop() {
        this.__updater?.stop();
        if (this.onMessage) this.Dispatcher?.unsubscribe("MESSAGE_CREATE", this.onMessage);
        this.queue = [];
        this.root?.unmount(); this.root = null;
        this.container?.remove(); this.container = null;
        DOM.removeStyle();
    }

    // ---------- Filterlogik (wie im Original) ----------
    handleMessage({ message, optimistic }) {
        if (optimistic || !message?.author) return;
        const channel = this.ChannelStore.getChannel(message.channel_id);
        if (!channel) return;
        const s = this.s;
        const me = this.UserStore.getCurrentUser();

        if (message.author.id === me.id
            || channel.id === this.SelectedChannelStore.getChannelId()
            || this.parseIds(s.ignoreUsers).includes(message.author.id)
            || (s.respectDoNotDisturb && this.PresenceStore.getStatus(me.id) === "dnd")
            || (s.disableInStreamerMode && this.StreamerModeStore?.enabled)) return;

        if (channel.guild_id) {
            if (!this.shouldNotifyGuild(message, channel, s)) return;
        } else if ((!s.directMessages && channel.isDM()) || (!s.groupMessages && channel.isGroupDM())
            || this.UserGuildSettingsStore.isChannelMuted(null, channel.id)) return;

        let record;
        try { record = this.MessageStore.getMessages(message.channel_id)?.receiveMessage(message)?.get(message.id); } catch { }

        this.show({
            message, record, channel,
            onClick: () => channel.guild_id ? this.navigate(channel) : this.PrivateChannelActions?.selectPrivateChannel(channel.id)
        });
    }

    shouldNotifyGuild(message, channel, s) {
        if (this.parseIds(s.notifyFor).includes(channel.id)) return true;
        if (s.friendServerNotifications && this.RelationshipStore.isFriend(message.author.id)) return true;
        if (this.UserGuildSettingsStore.isGuildOrCategoryOrChannelMuted(channel.guild_id, channel.id)) return false;
        const ugs = this.UserGuildSettingsStore.getAllSettings?.()?.userGuildSettings?.[channel.guild_id];
        if (!ugs) return false;
        const ov = ugs.channel_overrides?.[channel.id];
        const level = (ov && typeof ov === "object" && "message_notifications" in ov && ov.message_notifications !== 3)
            ? ov.message_notifications
            : (typeof ugs.message_notifications === "number" ? ugs.message_notifications : NOTIFY.NONE);
        if (level === NOTIFY.NONE) return false;
        if (level === NOTIFY.ALL) return true;
        const meId = this.UserStore.getCurrentUser().id;
        return message.mentions?.some?.(m => (m.id ?? m) === meId) || message.content?.includes(`<@${meId}>`);
    }

    navigate(channel) {
        if (!this.ChannelStore.getChannel(channel.id)) return;
        this.transitionTo?.(`/channels/${channel.guild_id ?? "@me"}/${channel.id}`);
        if (channel.isGuildVocal?.()) this.RTCActions?.updateChatOpen(channel.id, true);
    }

    ack(channelId, messageId) {
        this.Dispatcher.dispatch({ type: "BULK_ACK", context: "APP", channels: [{ channelId, messageId, readStateType: 0 }] });
    }

    // ---------- Rendering ----------
    getRoot() {
        if (!this.root) {
            this.container = document.createElement("div");
            this.container.id = `${P}container`;
            document.body.append(this.container);
            this.root = this.createRoot(this.container);
        }
        this.container.className = `${P}pos-${this.s.position}`;
        return this.root;
    }

    render() { this.getRoot().render(React.createElement(React.Fragment, null, this.queue.map(q => q.el))); }

    show(data) {
        const id = String(this.nextId++);
        const close = () => {
            this.queue = this.queue.filter(q => q.id !== id);
            this.render();
        };
        const el = React.createElement(Boundary, { key: id, onError: close },
            React.createElement(this.Toast, { plugin: this, data, onClose: close }));
        this.queue.push({ id, el });
        while (this.queue.length > this.s.maxNotifications) this.queue.shift();
        this.render();
    }

    header(channel) {
        if (channel.isGroupDM?.()) {
            const icon = channel.icon ? this.IconUtils?.getChannelIconURL?.({ id: channel.id, icon: channel.icon, size: 32 }) : null;
            let name = channel.name?.trim() || (channel.rawRecipients ?? []).slice(0, 3).map(u => u.username).join(", ");
            if (name.length > 20) name = name.slice(0, 20) + "…";
            return React.createElement("div", { className: `${P}header` }, icon && React.createElement("img", { src: icon }),
                React.createElement("span", { className: `${P}header-name` }, name));
        }
        if (channel.guild_id) {
            const g = this.GuildStore.getGuild(channel.guild_id);
            const icon = g?.icon ? this.IconUtils?.getGuildIconURL?.({ id: g.id, icon: g.icon, size: 32 }) : null;
            return React.createElement("div", { className: `${P}header` }, icon && React.createElement("img", { src: icon }),
                React.createElement("span", { className: `${P}header-name` }, g?.name ?? "Unbekannter Server",
                    channel.name && React.createElement(React.Fragment, null,
                        React.createElement("span", { className: `${P}sep` }, " › "),
                        React.createElement("span", { className: `${P}chan` }, "#" + channel.name))));
        }
        return null;
    }

    fallbackMessage(message) {
        const u = message.author;
        const avatar = u?.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : null;
        const text = (message.content || (message.attachments?.length ? "📎 Anhang" : message.embeds?.length ? "🔗 Embed" : "")).slice(0, 500);
        return React.createElement("div", { className: `${P}fallback` },
            avatar && React.createElement("img", { src: avatar }),
            React.createElement("div", null, React.createElement("b", null, u?.global_name ?? u?.globalName ?? u?.username),
                React.createElement("p", { className: `${P}p` }, text)));
    }

    Toast = ({ plugin, data, onClose }) => {
        const [hover, setHover] = useState(false);
        const [elapsed, setElapsed] = useState(0);
        const start = useRef(Date.now());
        const s = plugin.s;
        const timeout = (s.timeout ?? 5) * 1000;

        useEffect(() => {
            if (hover || data.permanent) { setElapsed(0); return; }
            start.current = Date.now();
            const t = setInterval(() => {
                const n = Date.now() - start.current;
                if (n >= timeout) onClose(); else setElapsed(n);
            }, 50);
            return () => clearInterval(t);
        }, [hover, data.permanent, timeout]);

        const isMsg = !!data.message;
        let content;
        if (isMsg) {
            const body = plugin.MessageComponent && data.record
                ? React.createElement(Boundary, { onError: () => { } }, React.createElement(plugin.MessageComponent, {
                    id: `bd-toast-mock-${data.message.id}`, message: data.record, channel: data.channel, subscribeToComponentDispatch: false
                }))
                : plugin.fallbackMessage(data.message);
            content = React.createElement("div", { className: `${P}content` }, plugin.header(data.channel), body);
        } else {
            content = React.createElement("div", { className: `${P}system` },
                data.icon && React.createElement("img", { src: data.icon }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("h2", { className: `${P}title` }, data.title),
                    data.body && React.createElement("p", { className: `${P}p` }, data.body)));
        }

        return React.createElement("button", {
            className: `${P}root`, style: { opacity: s.opacity / 100 },
            onClick: () => { data.onClick?.(); onClose(); },
            onContextMenu: e => { e.preventDefault(); e.stopPropagation(); if (isMsg) plugin.ack(data.channel.id, data.message.id); onClose(); },
            onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false)
        },
        React.createElement("span", {
            className: `${P}close`, role: "button", title: "Schließen",
            onClick: e => { e.preventDefault(); e.stopPropagation(); onClose(); }
        }, React.createElement("svg", { viewBox: "0 0 24 24" }, React.createElement("path", { fill: "currentColor", d: "M18.4 4 12 10.4 5.6 4 4 5.6 10.4 12 4 18.4 5.6 20 12 13.6 18.4 20 20 18.4 13.6 12 20 5.6z" }))),
        content,
        !data.permanent && React.createElement("div", { className: `${P}progress`, style: { width: `${(1 - elapsed / timeout) * 100}%` } }));
    };

    showExample() {
        const me = this.UserStore.getCurrentUser();
        this.show({ title: "Beispiel-Benachrichtigung", body: "So sieht ein Toast aus!", icon: this.IconUtils?.getUserAvatarURL?.(me) });
    }

    getSettingsPanel() {
        const s = this.s;
        const range = (a, b, st = 1) => Array.from({ length: Math.floor((b - a) / st) + 1 }, (_, i) => a + i * st);
        return UI.buildSettingsPanel({
            settings: [
                { type: "dropdown", id: "position", name: "Position", value: s.position, options: [
                    { label: "Unten links", value: "bottom-left" }, { label: "Oben links", value: "top-left" },
                    { label: "Oben rechts", value: "top-right" }, { label: "Unten rechts", value: "bottom-right" }] },
                { type: "slider", id: "timeout", name: "Anzeigedauer (Sekunden)", value: s.timeout, min: 1, max: 15, step: 1, markers: range(1, 15) },
                { type: "slider", id: "opacity", name: "Deckkraft (%)", value: s.opacity, min: 10, max: 100, step: 10, markers: range(10, 100, 10) },
                { type: "slider", id: "maxNotifications", name: "Maximal gleichzeitig", value: s.maxNotifications, min: 1, max: 5, step: 1, markers: range(1, 5) },
                { type: "switch", id: "disableInStreamerMode", name: "Im Streamer-Modus ausblenden", value: s.disableInStreamerMode },
                { type: "switch", id: "respectDoNotDisturb", name: "Bei „Nicht stören“ ausblenden", value: s.respectDoNotDisturb },
                { type: "switch", id: "directMessages", name: "Direktnachrichten", value: s.directMessages },
                { type: "switch", id: "groupMessages", name: "Gruppen-DMs", value: s.groupMessages },
                { type: "switch", id: "friendServerNotifications", name: "Freunde in Servern", note: "Auch wenn der Kanal sonst nicht benachrichtigt", value: s.friendServerNotifications },
                { type: "text", id: "ignoreUsers", name: "Ignorierte User-IDs", note: "Kommagetrennt", value: s.ignoreUsers, placeholder: "000000000000000000, 111111111111111111" },
                { type: "text", id: "notifyFor", name: "Kanal-IDs immer benachrichtigen", note: "Kommagetrennt", value: s.notifyFor, placeholder: "000000000000000000, 111111111111111111" },
                { type: "custom", id: "example", name: "Vorschau", children: React.createElement("button", {
                    onClick: () => this.showExample(),
                    style: { background: "var(--brand-500, #5865f2)", color: "#fff", border: 0, borderRadius: 4, padding: "8px 14px", fontWeight: 500, cursor: "pointer" }
                }, "Beispiel anzeigen") }
            ],
            onChange: (_c, id, v) => {
                this.set(id, v);
                if (id === "position" && this.container) this.container.className = `${P}pos-${v}`;
            }
        });
    }
};
