/**
 * @name VoiceChatUtilities
 * @author D3SOX, nickwoah (Equicord) · BD-Port
 * @version 1.0.1
 * @description Aktionen für einen ganzen Voice-Kanal per Rechtsklick: alle erwähnen, trennen, (un)muten, (un)deafen, verschieben. Port des Equicord-Plugins.
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/voiceChatUtils
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/VoiceChatUtilities/VoiceChatUtilities.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — basiert auf Vencord/Equicord-Code */
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
})(new BdApi("VoiceChatUtilities"));
//#endregion Updater

const { ContextMenu, Webpack, Data, UI, Logger } = new BdApi("VoiceChatUtilities");
const { Filters } = Webpack;

const DEFAULTS = { waitAfter: 5, waitSeconds: 2 };

module.exports = class VoiceChatUtilities {
    constructor(meta) { this.meta = meta; this.unpatches = []; }

    get settings() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("VoiceChatUtilities", BdApi.Plugins.get("VoiceChatUtilities")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        this.VoiceStateStore = Webpack.getStore("VoiceStateStore");
        this.UserStore = Webpack.getStore("UserStore");
        this.GuildChannelStore = Webpack.getStore("GuildChannelStore");
        this.RestAPI = Webpack.getModule(m => typeof m === "object" && m.del && m.put && m.patch, { searchExports: true });
        this.ComponentDispatch = Webpack.getModule(Filters.byKeys("dispatchToLastSubscribed", "emitter"), { searchExports: true });

        if (!this.VoiceStateStore || !this.RestAPI) {
            UI.showToast("VoiceChatUtilities: benötigte Discord-Module nicht gefunden", { type: "error" });
            Logger.error("Missing modules", { VoiceStateStore: !!this.VoiceStateStore, RestAPI: !!this.RestAPI });
            return;
        }
        this.unpatches.push(ContextMenu.patch("channel-context", (tree, props) => this.patchMenu(tree, props)));
    }

    stop() {
        this.__updater?.stop(); this.unpatches.forEach(u => u()); this.unpatches = []; }

    getStates(channelId) { return this.VoiceStateStore.getVoiceStatesForChannel(channelId) ?? {}; }

    async runSequential(tasks) {
        const { waitAfter, waitSeconds } = this.settings;
        for (let i = 0; i < tasks.length; i++) {
            try { await tasks[i](); } catch (e) { Logger.error("Request failed", e); }
            if ((i + 1) % waitAfter === 0 && i < tasks.length - 1) await new Promise(r => setTimeout(r, waitSeconds * 1000));
        }
    }

    sendPatch(channel, body, includeSelf = false) {
        const myId = this.UserStore.getCurrentUser()?.id;
        const tasks = Object.values(this.getStates(channel.id))
            .filter(s => includeSelf || s.userId !== myId)
            .map(s => () => this.RestAPI.patch({ url: `/guilds/${channel.guild_id}/members/${s.userId}`, body }));
        this.runSequential(tasks).then(() => UI.showToast(`Voice Tools: ${tasks.length} Aktion(en) ausgeführt`, { type: "success" }));
    }

    mentionAll(channel) {
        const myId = this.UserStore.getCurrentUser()?.id;
        const ids = [...new Set(Object.values(this.getStates(channel.id)).map(s => s.userId))].filter(id => id && id !== myId);
        if (!ids.length) return;
        const text = ids.map(id => `<@${id}>`).join(" ") + " ";
        this.ComponentDispatch?.dispatchToLastSubscribed("INSERT_TEXT", { rawText: text, plainText: text });
    }

    patchMenu(tree, { channel }) {
        if (!channel || (channel.type !== 2 && channel.type !== 13)) return;
        if (!Object.keys(this.getStates(channel.id)).length) return;

        const others = (this.GuildChannelStore?.getChannels(channel.guild_id)?.VOCAL ?? [])
            .map(e => e.channel).filter(c => c.id !== channel.id);

        const item = ContextMenu.buildItem({
            type: "submenu", id: "voice-tools", label: "Voice Tools",
            items: [
                { id: "vt-mention", label: "Alle erwähnen", action: () => this.mentionAll(channel) },
                { id: "vt-disconnect", label: "Alle trennen", danger: true, action: () => this.sendPatch(channel, { channel_id: null }) },
                { id: "vt-mute", label: "Alle muten", action: () => this.sendPatch(channel, { mute: true }) },
                { id: "vt-unmute", label: "Alle entmuten", action: () => this.sendPatch(channel, { mute: false }) },
                { id: "vt-deafen", label: "Alle deafen", action: () => this.sendPatch(channel, { deaf: true }) },
                { id: "vt-undeafen", label: "Alle undeafen", action: () => this.sendPatch(channel, { deaf: false }) },
                {
                    type: "submenu", id: "vt-move", label: "Alle verschieben nach…",
                    items: others.map(c => ({ id: `vt-move-${c.id}`, label: c.name, action: () => this.sendPatch(channel, { channel_id: c.id }, true) }))
                }
            ]
        });

        const children = tree?.props?.children;
        if (Array.isArray(children)) children.splice(-1, 0, item);
        else if (tree?.props) tree.props.children = [children, item];
    }

    getSettingsPanel() {
        const s = this.settings;
        return UI.buildSettingsPanel({
            settings: [
                { type: "slider", id: "waitAfter", name: "Aktionen bis zur Pause", note: "Gegen Rate-Limits", min: 1, max: 20, step: 1, value: s.waitAfter },
                { type: "slider", id: "waitSeconds", name: "Pause (Sekunden)", min: 1, max: 10, step: 0.5, value: s.waitSeconds }
            ],
            onChange: (_cat, id, value) => Data.save("settings", { ...this.settings, [id]: value })
        });
    }
};
