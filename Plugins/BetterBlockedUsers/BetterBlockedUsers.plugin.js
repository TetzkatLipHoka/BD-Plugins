/**
 * @name BetterBlockedUsers
 * @author Equicord-Team · BD-Port (Teil-Port)
 * @version 1.0.4
 * @description Skips the "view profile anyway?" prompt for blocked users and adds a searchable blocked-user list with a profile button (plugin settings, or right-click the settings cog bottom-left). Partial port of the Equicord plugin.
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/betterBlockedUsers
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterBlockedUsers/BetterBlockedUsers.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — based on Equicord code */
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
})(new BdApi("BetterBlockedUsers"));
//#endregion Updater

const { Webpack, Patcher, ContextMenu, React, DOM, Data, UI, Logger } = new BdApi("BetterBlockedUsers");
const { Filters } = Webpack;
const { useState, useMemo } = React;

const DEFAULTS = { skipPrompt: true };

const CSS = `
.bd-bbu-wrap { display: flex; flex-direction: column; gap: 8px; min-width: 420px; }
.bd-bbu-search { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--input-border-default, var(--background-modifier-accent));
  background: var(--input-background-default, var(--input-background)); color: var(--text-default, var(--text-normal)); font-size: 14px; }
.bd-bbu-list { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.bd-bbu-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.bd-bbu-row:hover { background: var(--background-modifier-hover); }
.bd-bbu-row img { width: 32px; height: 32px; border-radius: 50%; }
.bd-bbu-name { flex: 1; min-width: 0; color: var(--text-default, var(--text-normal)); }
.bd-bbu-name small { display: block; color: var(--text-muted); font-size: 12px; user-select: text; }
.bd-bbu-btn { background: var(--button-secondary-background, #4e5058); color: #fff; border: 0; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 13px; }
.bd-bbu-btn:hover { filter: brightness(1.15); }
.bd-bbu-count { color: var(--text-muted); font-size: 12px; }
`;

module.exports = class BetterBlockedUsers {
    constructor() { this.unpatches = []; }
    get s() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("BetterBlockedUsers", BdApi.Plugins.get("BetterBlockedUsers")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        this.RelationshipStore = Webpack.getStore("RelationshipStore");
        this.UserStore = Webpack.getStore("UserStore");
        this.SelectedGuildStore = Webpack.getStore("SelectedGuildStore");
        this.SelectedChannelStore = Webpack.getStore("SelectedChannelStore");
        this.openProfileModal = Webpack.getModule(Filters.byStrings('type:"USER_PROFILE_MODAL_OPEN"'), { searchExports: true });

        // Hook that decides whether the blocked/ignored prompt is shown → [show, dismiss]
        const [mod, key] = Webpack.getWithKey(m => typeof m === "function" && (() => {
            const src = String(m);
            return src.includes("isBlocked:") && src.includes("isIgnored:") && src.includes(".useSetting()") && src.includes("useCallback");
        })()) ?? [];
        if (mod) {
            Logger.info("Prompt hook found");
            Patcher.after(mod, key, (_, [userId], ret) => {
                if (!this.s.skipPrompt || !Array.isArray(ret) || !ret[0]) return;
                if (this.RelationshipStore.isBlocked(userId) && !this.RelationshipStore.isIgnored?.(userId)) ret[0] = false;
            });
        } else Logger.warn("Blocked-prompt hook not found – skipping disabled");

        const cogPatch = tree => {
            const item = ContextMenu.buildItem({ id: "bd-bbu-open", label: "Search blocked users", action: () => this.openModal() });
            const c = tree?.props?.children;
            if (Array.isArray(c)) c.push(item); else if (tree?.props) tree.props.children = [c, item];
        };
        // Settings cog bottom-left: currently "settings-menu", formerly "user-settings-cog"
        for (const nav of ["settings-menu", "user-settings-cog"]) this.unpatches.push(ContextMenu.patch(nav, cogPatch));
    }

    stop() {
        this.__updater?.stop(); Patcher.unpatchAll(); this.unpatches.forEach(u => u()); this.unpatches = []; DOM.removeStyle(); }

    blockedIds() {
        const RS = this.RelationshipStore;
        if (typeof RS.getBlockedIDs === "function") return RS.getBlockedIDs();
        const m = RS.getMutableRelationships?.() ?? RS.getRelationships?.() ?? {};
        const entries = m instanceof Map ? [...m.entries()] : Object.entries(m);
        return entries.filter(([, t]) => (typeof t === "object" ? t.type : t) === 2).map(([id]) => id);
    }

    openProfile(userId) {
        if (!this.openProfileModal) return UI.showToast("Profile function not found", { type: "error" });
        this.openProfileModal({
            userId, guildId: this.SelectedGuildStore.getGuildId(), channelId: this.SelectedChannelStore.getChannelId(),
            sourceAnalyticsLocations: ["username", "user profile popout"]
        });
    }

    List = ({ plugin }) => {
        const [q, setQ] = useState("");
        const ids = useMemo(() => plugin.blockedIds(), []);
        const rows = useMemo(() => {
            const s = q.toLowerCase().trim();
            return ids.map(id => ({ id, user: plugin.UserStore.getUser(id) }))
                .filter(({ id, user }) => !s || id === s || user?.username?.toLowerCase().includes(s) || (user?.globalName ?? user?.global_name)?.toLowerCase().includes(s));
        }, [q, ids]);
        return React.createElement("div", { className: "bd-bbu-wrap" },
            React.createElement("input", { className: "bd-bbu-search", placeholder: "Username, display name or ID …", value: q, autoFocus: true, onChange: e => setQ(e.target.value) }),
            React.createElement("div", { className: "bd-bbu-count" }, `${rows.length} of ${ids.length} blocked users`),
            React.createElement("div", { className: "bd-bbu-list" }, rows.map(({ id, user }) =>
                React.createElement("div", { className: "bd-bbu-row", key: id },
                    React.createElement("img", { src: user?.getAvatarURL?.(null, 32) ?? "https://cdn.discordapp.com/embed/avatars/0.png" }),
                    React.createElement("div", { className: "bd-bbu-name" },
                        user ? (user.globalName ?? user.global_name ?? user.username) : "Unknown user",
                        React.createElement("small", null, user ? `@${user.username} · ${id}` : id)),
                    React.createElement("button", { className: "bd-bbu-btn", onClick: () => plugin.openProfile(id) }, "View profile")))));
    };

    openModal() {
        UI.showConfirmationModal("Blocked users", React.createElement(this.List, { plugin: this }), { confirmText: "Close", cancelText: null });
    }

    getSettingsPanel() {
        const panel = UI.buildSettingsPanel({
            settings: [{ type: "switch", id: "skipPrompt", name: "Skip the prompt on blocked profiles", note: "Ignored users still show the prompt", value: this.s.skipPrompt }],
            onChange: (_c, id, v) => Data.save("settings", { ...this.s, [id]: v })
        });
        return React.createElement("div", null, panel, React.createElement("div", { style: { marginTop: 16 } }, React.createElement(this.List, { plugin: this })));
    }
};
