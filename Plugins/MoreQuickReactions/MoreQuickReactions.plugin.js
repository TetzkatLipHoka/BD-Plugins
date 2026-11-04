/**
 * @name MoreQuickReactions
 * @author Equicord/Vencord-Team · BD-Port (vereinfacht)
 * @version 1.0.6
 * @description More quick reactions at the top of the message context menu (instead of a fixed 4), in multiple rows, optionally from your frequently used emojis instead of favorites. Simplified port of the Vencord plugin (no scrolling, hover bar unchanged).
 * @source https://github.com/Vendicated/Vencord/tree/main/src/plugins/moreQuickReactions
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MoreQuickReactions/MoreQuickReactions.plugin.js
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
})(new BdApi("MoreQuickReactions"));
//#endregion Updater

const { Webpack, Patcher, DOM, Data, UI, Logger } = new BdApi("MoreQuickReactions");

const DEFAULTS = { reactionCount: 10, columns: 5, frequentEmojis: false };

module.exports = class MoreQuickReactions {
    get s() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("MoreQuickReactions", BdApi.Plugins.get("MoreQuickReactions")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        this.EmojiStore = Webpack.getStore("EmojiStore");
        // Hook D6: function X(e){…getDisambiguatedEmojiContext(e).getEmojiInPriorityOrderWithoutFetchingLatest()}
        const found = Webpack.getWithKey(m => typeof m === "function" && m.length === 1 && (() => {
            const src = String(m);
            return src.includes("getDisambiguatedEmojiContext(") && src.includes(".getEmojiInPriorityOrderWithoutFetchingLatest()") && src.includes("loadIfNecessary");
        })());
        const [mod, key] = found ?? [];
        this.key = key;
        if (!mod || !key) {
            UI.showToast("MoreQuickReactions: emoji hook not found", { type: "error" });
            return Logger.error("Hook not found");
        }
        Logger.info("Hook found");
        this.calls = 0;

        const plugin = this;
        // Array whose filter() result can't be truncated below the configured limit
        function makeArr(len) {
            const arr = new Array(len);
            return new Proxy(arr, {
                set(t, p, v) {
                    if (p === "length" && typeof v === "number" && v < t.length) {
                        t.length = Math.max(v, Math.min(t.length, plugin.s.reactionCount));
                        return true;
                    }
                    t[p] = v; return true;
                }
            });
        }
        class NoTrunc extends Array { static get [Symbol.species]() { return makeArr; } }
        this.cache = new WeakMap();

        Patcher.after(mod, this.key, (_, [guildId], ret) => {
            try {
                let src = ret;
                if (this.s.frequentEmojis) {
                    const ctx = this.EmojiStore?.getDisambiguatedEmojiContext?.(guildId);
                    const freq = ctx?.getFrequentlyUsedReactionEmojisWithoutFetchingLatest?.();
                    if (Array.isArray(freq) && freq.length) src = freq;
                }
                if (!Array.isArray(src)) return ret;
                let out = this.cache.get(src);
                if (!out) { out = NoTrunc.from(src); this.cache.set(src, out); }
                return out;
            } catch (e) { Logger.error(e); return ret; }
        });
        // Also patch the data source directly (emoji context prototype), in case the menu doesn't use the hook export
        try {
            const ctx = this.EmojiStore?.getDisambiguatedEmojiContext?.(null);
            const proto = ctx && Object.getPrototypeOf(ctx);
            if (proto?.getEmojiInPriorityOrderWithoutFetchingLatest) {
                this.protoCalls = 0;
                Patcher.after(proto, "getEmojiInPriorityOrderWithoutFetchingLatest", function (thisObj, __, ret) {
                    try {
                        let src = ret;
                        if (plugin.s.frequentEmojis) {
                            const freq = thisObj.getFrequentlyUsedReactionEmojisWithoutFetchingLatest?.();
                            if (Array.isArray(freq) && freq.length) src = freq;
                        }
                        if (!Array.isArray(src)) return ret;
                        if (src instanceof NoTrunc) return src;
                        let out = plugin.cache.get(src);
                        if (!out) { out = NoTrunc.from(src); plugin.cache.set(src, out); }
                        return out;
                    } catch (e) { Logger.error(e); return ret; }
                });
                Logger.info("Data source patched");
            } else Logger.warn("Emoji context not found");
        } catch (e) { Logger.error(e); }
        this.applyCss();
    }

    applyCss() {
        const cols = this.s.columns;
        DOM.removeStyle();
        DOM.addStyle(`
[role="group"]:has(> [id^="message-quickreact-"]) {
  display: grid !important; grid-template-columns: repeat(${cols}, 1fr); gap: 2px; justify-items: center;
}
[id^="message-quickreact-"] { margin: 0 !important; }
`);
    }

    stop() {
        this.__updater?.stop(); Patcher.unpatchAll(); DOM.removeStyle(); this.cache = null; }

    getSettingsPanel() {
        const s = this.s;
        const r = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
        return UI.buildSettingsPanel({
            settings: [
                { type: "slider", id: "reactionCount", name: "Number of quick reactions", note: "Discord default: 4", min: 4, max: 30, step: 1, value: s.reactionCount, markers: [4, 10, 15, 20, 25, 30] },
                { type: "slider", id: "columns", name: "Columns", min: 3, max: 10, step: 1, value: s.columns, markers: r(3, 10) },
                { type: "switch", id: "frequentEmojis", name: "Frequently used instead of favorites", note: "Fills the list with your most used reactions", value: s.frequentEmojis }
            ],
            onChange: (_c, id, v) => { Data.save("settings", { ...this.s, [id]: v }); if (id === "columns") this.applyCss(); }
        });
    }
};
