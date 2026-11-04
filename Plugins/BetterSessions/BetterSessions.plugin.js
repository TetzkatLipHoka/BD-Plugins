/**
 * @name BetterSessions
 * @author amia (Vencord) · BD-Port (vereinfacht)
 * @version 1.0.3
 * @description Checks for new logins (devices/sessions) in the background and notifies you. Own overview with exact timestamps and custom names per session (right-click the settings cog bottom-left → "Sessions"). Simplified port of the Vencord plugin (own window instead of modifying the Devices page).
 * @source https://github.com/Vendicated/Vencord/tree/main/src/plugins/betterSessions
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterSessions/BetterSessions.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — based on Vencord code */
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
})(new BdApi("BetterSessions"));
//#endregion Updater

const { Webpack, ContextMenu, React, DOM, Data, UI, Logger } = new BdApi("BetterSessions");
const { useState, useEffect } = React;

const DEFAULTS = { backgroundCheck: true, checkInterval: 20 };

const OS_COLORS = { Windows: "#55a6ef", "Windows Mobile": "#55a6ef", Linux: "#cdcd31", Android: "#7bc958", "Horizon OS": "#0081fb" };

const CSS = `
.bd-bs-wrap { display: flex; flex-direction: column; gap: 6px; min-width: 480px; max-height: 60vh; overflow-y: auto; }
.bd-bs-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; background: var(--background-base-lower, var(--background-secondary)); }
.bd-bs-os { width: 10px; height: 36px; border-radius: 4px; flex-shrink: 0; }
.bd-bs-main { flex: 1; min-width: 0; color: var(--text-default, var(--text-normal)); }
.bd-bs-title { font-weight: 600; color: var(--text-strong, var(--header-primary)); display: flex; align-items: center; gap: 6px; }
.bd-bs-sub { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
.bd-bs-new { background: var(--brand-500, #5865f2); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.bd-bs-cur { background: var(--status-positive, #23a55a); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 4px; }
.bd-bs-input { padding: 5px 8px; border-radius: 4px; border: 1px solid var(--input-border-default, var(--background-modifier-accent));
  background: var(--input-background-default, var(--input-background)); color: var(--text-default, var(--text-normal)); width: 180px; }
.bd-bs-btn { background: var(--button-secondary-background, #4e5058); color: #fff; border: 0; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 13px; }
.bd-bs-msg { color: var(--text-muted); padding: 10px 0; }
`;

module.exports = class BetterSessions {
    constructor() { this.unpatches = []; }
    get s() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    // saved sessions per account: { [id_hash]: { name, isNew } }
    key() { return "sessions_" + (this.UserStore.getCurrentUser()?.id ?? "x"); }
    loadSaved() { return Data.load(this.key()) ?? {}; }
    saveSaved(v) { Data.save(this.key(), v); }

    start() {
        this.__updater = new UpdateManager("BetterSessions", BdApi.Plugins.get("BetterSessions")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        this.UserStore = Webpack.getStore("UserStore");
        this.RestAPI = Webpack.getModule(m => typeof m === "object" && m.del && m.put && m.get, { searchExports: true });
        if (!this.RestAPI) { UI.showToast("BetterSessions: RestAPI not found", { type: "error" }); return; }

        const cogPatch = tree => {
            const item = ContextMenu.buildItem({ id: "bd-bs-open", label: "Sessions", action: () => this.openModal() });
            const c = tree?.props?.children;
            if (Array.isArray(c)) c.push(item); else if (tree?.props) tree.props.children = [c, item];
        };
        // Settings cog bottom-left: currently "settings-menu", formerly "user-settings-cog"
        for (const nav of ["settings-menu", "user-settings-cog"]) this.unpatches.push(ContextMenu.patch(nav, cogPatch));

        // First run: silently adopt known sessions (no notification flood on first start)
        this.check(Object.keys(this.loadSaved()).length === 0);
        if (this.s.backgroundCheck) this.timer = setInterval(() => this.check(false), Math.max(1, this.s.checkInterval) * 60000);
    }

    stop() {
        this.__updater?.stop(); clearInterval(this.timer); this.unpatches.forEach(u => u()); this.unpatches = []; DOM.removeStyle(); }

    async fetchSessions() {
        const res = await this.RestAPI.get({ url: "/auth/sessions" });
        return res?.body?.user_sessions ?? [];
    }

    async check(silent) {
        try {
            const sessions = await this.fetchSessions();
            const saved = this.loadSaved();
            for (const s of sessions) {
                if (saved[s.id_hash]) continue;
                saved[s.id_hash] = { name: "", isNew: !silent };
                if (!silent) {
                    const ci = s.client_info ?? {};
                    const text = `New session: ${ci.os ?? "?"} · ${ci.platform ?? "?"} · ${ci.location ?? "?"}`;
                    if (UI.showNotification) UI.showNotification({ title: "BetterSessions", content: text, type: "warning", duration: Infinity });
                    else UI.showToast(text, { type: "warning", timeout: 15000 });
                }
            }
            // clean up removed sessions
            const live = new Set(sessions.map(s => s.id_hash));
            if (sessions.length) for (const h of Object.keys(saved)) if (!live.has(h)) delete saved[h];
            this.saveSaved(saved);
            return sessions;
        } catch (e) { Logger.error("Session check failed", e); return null; }
    }

    View = ({ plugin }) => {
        const [sessions, setSessions] = useState(null);
        const [saved, setSaved] = useState(() => plugin.loadSaved());
        useEffect(() => { plugin.check(false).then(s => { setSessions(s ?? []); setSaved(plugin.loadSaved()); }); }, []);
        useEffect(() => () => { // reset "NEW" on close
            const v = plugin.loadSaved(); for (const k in v) v[k].isNew = false; plugin.saveSaved(v);
        }, []);

        const rename = (hash, name) => {
            const v = { ...plugin.loadSaved() }; v[hash] = { ...(v[hash] ?? { isNew: false }), name }; plugin.saveSaved(v); setSaved(v);
        };

        if (!sessions) return React.createElement("div", { className: "bd-bs-msg" }, "Loading sessions …");
        if (!sessions.length) return React.createElement("div", { className: "bd-bs-msg" }, "No sessions found.");

        return React.createElement("div", { className: "bd-bs-wrap" }, sessions
            .slice().sort((a, b) => new Date(b.approx_last_used_time) - new Date(a.approx_last_used_time))
            .map(s => {
                const ci = s.client_info ?? {};
                const info = saved[s.id_hash] ?? {};
                const last = s.approx_last_used_time ? new Date(s.approx_last_used_time) : null;
                return React.createElement("div", { className: "bd-bs-row", key: s.id_hash },
                    React.createElement("div", { className: "bd-bs-os", style: { background: OS_COLORS[ci.os] ?? "#f3799a" } }),
                    React.createElement("div", { className: "bd-bs-main" },
                        React.createElement("div", { className: "bd-bs-title" },
                            info.name ? `${info.name}*` : `${ci.os ?? "?"} · ${ci.platform ?? "?"}`,
                            info.isNew && React.createElement("span", { className: "bd-bs-new" }, "NEW")),
                        React.createElement("div", { className: "bd-bs-sub" },
                            `${ci.location ?? "unknown location"} · last active ${last ? last.toLocaleString() : "?"}`)),
                    React.createElement("input", {
                        className: "bd-bs-input", placeholder: "Custom name …", defaultValue: info.name ?? "",
                        onBlur: e => rename(s.id_hash, e.target.value.trim()),
                        onKeyDown: e => { if (e.key === "Enter") e.target.blur(); }
                    }));
            }));
    };

    openModal() {
        UI.showConfirmationModal("Sessions", React.createElement(this.View, { plugin: this }), { confirmText: "Close", cancelText: null });
    }

    getSettingsPanel() {
        const s = this.s;
        return UI.buildSettingsPanel({
            settings: [
                { type: "switch", id: "backgroundCheck", name: "Check for new sessions in the background", note: "Takes effect after restarting the plugin", value: s.backgroundCheck },
                { type: "number", id: "checkInterval", name: "Check interval (minutes)", min: 1, value: s.checkInterval }
            ],
            onChange: (_c, id, v) => Data.save("settings", { ...this.s, [id]: v })
        });
    }
};
