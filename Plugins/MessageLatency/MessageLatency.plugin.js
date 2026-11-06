/**
 * @name MessageLatency
 * @author arHSM (Vencord) · BD-Port
 * @version 1.0.3
 * @description Shows an indicator on messages that took ≥ n seconds to send (or whose sender's clock is off). Port of the Vencord plugin.
 * @source https://github.com/Vendicated/Vencord/tree/main/src/plugins/messageLatency
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MessageLatency/MessageLatency.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later - based on Vencord code */
"use strict";

//#region Updater - UpdateManager © Pharaoh2k, used with permission (see THIRD_PARTY_NOTICES.md)
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
        this._noticeContent = "";
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
        const handle = this.notification;
        this.notification = null;
        if (!handle) return;
        if (typeof handle === "function") return handle();
        if (handle.isVisible?.() === false) return;
        // BetterDiscord's handle.close() takes the notice out of its list without re-rendering, which leaves it on
        // screen with its buttons and X dead. Clicking its own X closes it through BetterDiscord's working path.
        const notice = [...document.querySelectorAll(".bd-notification")].find(el =>
            el.querySelector(".bd-notification-title")?.textContent === this.name &&
            el.querySelector(".bd-notification-content-text")?.textContent.includes(this._noticeContent));
        const closeButton = notice?.querySelector(".bd-notification-close");
        if (closeButton) closeButton.click();
        else handle.close?.();
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
        this._noticeContent = `v${version} is available`;
        const handle = UI.showNotification({
            id: `bd-plugin-update:${this.name}`,
            title: this.name,
            content: this._noticeContent,
            type: "info",
            duration: 6000000,
            // BetterDiscord closes the notice itself after an action runs, so the actions must not close it too
            actions: [
                {
                    label: "Update",
                    onClick: () => this.applyUpdate(text),
                },
                {
                    label: "Dismiss",
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
})(new BdApi("MessageLatency"));
//#endregion Updater

const { Webpack, Patcher, React, Components, Data, UI, Logger } = new BdApi("MessageLatency");

const DEFAULTS = { latency: 2, detectDiscordKotlin: true, showMillis: false, ignoreSelf: false };
const DISCORD_KT_DELAY = 1471228928;
const EPOCH = 1420070400000n;

function snowflakeTime(id) {
    try { return Number((BigInt(id) >> 22n) + EPOCH); } catch { return null; }
}

function stringDelta(delta, showMillis) {
    const diff = {
        d: Math.floor(delta / 86400000),
        h: Math.floor(delta / 3600000 % 24),
        min: Math.floor(delta / 60000 % 60),
        s: Math.floor(delta / 1000 % 60),
        ms: Math.floor(delta % 1000)
    };
    const parts = Object.entries(diff).filter(([k, v]) => v > 0 && (showMillis || k !== "ms")).map(([k, v]) => `${v} ${k}`);
    return parts.join(" ") || "0 s";
}

module.exports = class MessageLatency {
    get settings() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("MessageLatency", BdApi.Plugins.get("MessageLatency")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        this.UserStore = Webpack.getStore("UserStore");
        this.controller = new AbortController();
        // Message header (memo), contains GUILD_COMMUNICATION_DISABLED_ICON_TOOLTIP_BODY = AeYyL+.
        // Discord loads it with the chat, so wait for it instead of failing when Discord opens on another page.
        Webpack.waitForModule(m => m?.type && String(m.type).includes("AeYyL+") && String(m.type).includes("usernameSpanId"), { searchExports: true, signal: this.controller.signal })
            .then(Header => { if (Header && !this.controller.signal.aborted) this.patchHeader(Header); })
            .catch(err => Logger.error(err));
    }

    patchHeader(Header) {
        this.Header = Header;
        const self = this;
        this.Indicator = function LatencyIndicator({ message }) {
            const d = self.data(message);
            if (!d) return null;
            const text = !d.delta
                ? "Sender is probably on an old Discord Android client"
                : (d.ahead ? `This user's clock is ${d.delta} ahead.` : `This message was sent with a delay of ${d.delta}.`)
                  + (d.kotlin ? " Probably an old Discord Android client." : "");
            return React.createElement(Components.Tooltip, { text, position: "top" },
                props => self.icon(d.fill, props));
        };

        Patcher.after(this.Header, "type", (_, [props], ret) => {
            try {
                const kids = ret?.props?.username?.props?.children;
                if (!Array.isArray(kids) || !props?.message) return;
                kids.unshift(React.createElement(this.Indicator, { key: "bd-latency", message: props.message }));
            } catch (e) { Logger.error(e); }
        });
    }

    stop() {
        this.controller?.abort(); this.__updater?.stop(); Patcher.unpatchAll(); }

    data(message) {
        const { latency, detectDiscordKotlin, showMillis, ignoreSelf } = this.settings;
        const { id, nonce } = message ?? {};
        if (nonce == null || message.author?.bot) return null;
        if (ignoreSelf && message.author?.id === this.UserStore.getCurrentUser()?.id) return null;
        const a = snowflakeTime(id), b = snowflakeTime(nonce);
        if (a == null || b == null) return null;

        let delta = a - b, kotlin = false;
        if (!showMillis) delta = Math.round(delta / 1000) * 1000;
        if (-delta >= DISCORD_KT_DELAY - 86400000) { kotlin = detectDiscordKotlin; delta += DISCORD_KT_DELAY; }

        const abs = Math.abs(delta), ahead = abs !== delta, ms = latency * 1000;
        const str = abs >= ms ? stringDelta(abs, showMillis) : null;
        const TROLL = 2 * 60 * 1000;
        const fill = kotlin ? ["status-positive", "status-positive", "text-muted"]
            : delta >= TROLL || ahead ? ["text-muted", "text-muted", "text-muted"]
                : delta >= ms * 2 ? ["status-danger", "text-muted", "text-muted"]
                    : ["status-warning", "status-warning", "text-muted"];
        return (abs >= ms || kotlin) ? { delta: str, ahead, fill, kotlin } : null;
    }

    icon(fill, props) {
        const p = (f, d) => React.createElement("path", { fill: `var(--${f})`, d });
        return React.createElement("svg", {
            ...props, xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 16 16", width: 12, height: 12, role: "img", fill: "none",
            style: { marginRight: 8, verticalAlign: -1 }
        },
        p(fill[0], "M4.8 12c0-.44-.29-.8-.64-.8H2.24c-.35 0-.64.36-.64.8v1.6c0 .44.29.8.64.8h1.92c.35 0 .64-.36.64-.8L4.8 12Z"),
        p(fill[1], "M9.6 7.13c0-.4-.29-.73-.64-.73H7.04c-.35 0-.64.33-.64.73v6.54c0 .4.29.73.64.73h1.92c.35 0 .64-.33.64-.73V7.13Z"),
        p(fill[2], "M14.4 2.31c0-.39-.29-.71-.64-.71h-1.92c-.35 0-.64.32-.64.71v11.38c0 .39.29.71.64.71h1.92c.35 0 .64-.32.64-.71V2.31Z"));
    }

    getSettingsPanel() {
        const s = this.settings;
        return UI.buildSettingsPanel({
            settings: [
                { type: "number", id: "latency", name: "Threshold in seconds", value: s.latency, min: 0 },
                { type: "switch", id: "detectDiscordKotlin", name: "Detect old Discord Android clients", value: s.detectDiscordKotlin },
                { type: "switch", id: "showMillis", name: "Show milliseconds", value: s.showMillis },
                { type: "switch", id: "ignoreSelf", name: "Ignore your own messages", value: s.ignoreSelf }
            ],
            onChange: (_c, id, v) => Data.save("settings", { ...this.settings, [id]: v })
        });
    }
};
