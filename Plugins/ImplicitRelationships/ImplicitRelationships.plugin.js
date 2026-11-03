/**
 * @name ImplicitRelationships
 * @author Dolfies (Vencord) · BD-Port (vereinfacht)
 * @version 1.0.2
 * @description Zeigt deine „impliziten Beziehungen“: Leute, mit denen du laut Discord viel zu tun hast, die aber nicht in deiner Freundesliste sind – sortiert nach Kontakt-Rang. Öffnen per Rechtsklick aufs Zahnrad unten links oder in den Plugin-Einstellungen. Vereinfachter Port des Vencord-Plugins (eigenes Fenster statt eigener Freundes-Kategorie).
 * @source https://github.com/Vendicated/Vencord/tree/main/src/plugins/implicitRelationships
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ImplicitRelationships/ImplicitRelationships.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — basiert auf Vencord-Code */
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
})(new BdApi("ImplicitRelationships"));
//#endregion Updater

const { Webpack, ContextMenu, React, DOM, UI, Logger } = new BdApi("ImplicitRelationships");
const { Filters } = Webpack;
const { useState, useMemo } = React;

const CSS = `
.bd-ir-wrap { display: flex; flex-direction: column; gap: 8px; min-width: 440px; }
.bd-ir-search { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--input-border-default, var(--background-modifier-accent));
  background: var(--input-background-default, var(--input-background)); color: var(--text-default, var(--text-normal)); font-size: 14px; }
.bd-ir-list { max-height: 55vh; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.bd-ir-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.bd-ir-row:hover { background: var(--background-modifier-hover); }
.bd-ir-row img { width: 32px; height: 32px; border-radius: 50%; }
.bd-ir-rank { width: 2.2em; text-align: right; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.bd-ir-name { flex: 1; min-width: 0; color: var(--text-default, var(--text-normal)); }
.bd-ir-name small { display: block; color: var(--text-muted); font-size: 12px; user-select: text; }
.bd-ir-btn { background: var(--button-secondary-background, #4e5058); color: #fff; border: 0; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-size: 13px; margin-left: 4px; }
.bd-ir-btn:hover { filter: brightness(1.15); }
.bd-ir-note { color: var(--text-muted); font-size: 12px; }
`;

module.exports = class ImplicitRelationships {
    constructor() { this.unpatches = []; }

    start() {
        this.__updater = new UpdateManager("ImplicitRelationships", BdApi.Plugins.get("ImplicitRelationships")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        this.Affinities = Webpack.getStore("UserAffinitiesV2Store") ?? Webpack.getStore("UserAffinitiesStore");
        this.RelationshipStore = Webpack.getStore("RelationshipStore");
        this.UserStore = Webpack.getStore("UserStore");
        this.SelectedGuildStore = Webpack.getStore("SelectedGuildStore");
        this.SelectedChannelStore = Webpack.getStore("SelectedChannelStore");
        this.openProfileModal = Webpack.getModule(Filters.byStrings('type:"USER_PROFILE_MODAL_OPEN"'), { searchExports: true });
        this.PrivateChannelActions = Webpack.getModule(Filters.byKeys("openPrivateChannel"));
        if (!this.Affinities) {
            UI.showToast("ImplicitRelationships: Affinitäten-Store nicht gefunden", { type: "error" });
            return Logger.error("UserAffinities store missing");
        }
        const cogPatch = tree => {
            const item = ContextMenu.buildItem({ id: "bd-ir-open", label: "Implizite Beziehungen", action: () => this.openModal() });
            const c = tree?.props?.children;
            if (Array.isArray(c)) c.push(item); else if (tree?.props) tree.props.children = [c, item];
        };
        // Zahnrad unten links: aktuell "settings-menu", früher "user-settings-cog"
        for (const nav of ["settings-menu", "user-settings-cog"]) this.unpatches.push(ContextMenu.patch(nav, cogPatch));
    }

    stop() {
        this.__updater?.stop(); this.unpatches.forEach(u => u()); this.unpatches = []; DOM.removeStyle(); }

    implicit() {
        const list = this.Affinities.getUserAffinities?.() ?? this.Affinities.getState?.()?.userAffinities ?? [];
        return list
            .filter(a => a?.otherUserId && !this.RelationshipStore.getRelationshipType(a.otherUserId))
            .sort((a, b) => (a.communicationRank ?? 1e9) - (b.communicationRank ?? 1e9));
    }

    openProfile(userId) {
        this.openProfileModal?.({ userId, guildId: this.SelectedGuildStore.getGuildId(), channelId: this.SelectedChannelStore.getChannelId(), sourceAnalyticsLocations: ["username"] });
    }

    List = ({ plugin }) => {
        const [q, setQ] = useState("");
        const all = useMemo(() => plugin.implicit(), []);
        const rows = useMemo(() => {
            const s = q.toLowerCase().trim();
            return all.map(a => ({ a, user: plugin.UserStore.getUser(a.otherUserId) }))
                .filter(({ a, user }) => !s || a.otherUserId === s || user?.username?.toLowerCase().includes(s) || (user?.globalName ?? user?.global_name)?.toLowerCase().includes(s));
        }, [q, all]);
        const unknown = all.filter(a => !plugin.UserStore.getUser(a.otherUserId)).length;
        return React.createElement("div", { className: "bd-ir-wrap" },
            React.createElement("input", { className: "bd-ir-search", placeholder: "Suchen …", value: q, autoFocus: true, onChange: e => setQ(e.target.value) }),
            React.createElement("div", { className: "bd-ir-note" },
                `${all.length} Personen ohne Freundschaft, sortiert nach Kontakt-Rang (1 = am meisten).`
                + (unknown ? ` ${unknown} davon sind lokal nicht geladen und erscheinen nur mit ID.` : "")),
            React.createElement("div", { className: "bd-ir-list" }, rows.map(({ a, user }) =>
                React.createElement("div", { className: "bd-ir-row", key: a.otherUserId },
                    React.createElement("span", { className: "bd-ir-rank" }, a.communicationRank ?? "–"),
                    React.createElement("img", { src: user?.getAvatarURL?.(null, 32) ?? "https://cdn.discordapp.com/embed/avatars/0.png" }),
                    React.createElement("div", { className: "bd-ir-name" },
                        user ? (user.globalName ?? user.global_name ?? user.username) : "Nicht geladen",
                        React.createElement("small", null, user ? `@${user.username} · ${a.otherUserId}` : a.otherUserId)),
                    React.createElement("button", { className: "bd-ir-btn", onClick: () => plugin.openProfile(a.otherUserId) }, "Profil"),
                    plugin.PrivateChannelActions && React.createElement("button", { className: "bd-ir-btn", onClick: () => plugin.PrivateChannelActions.openPrivateChannel(a.otherUserId) }, "DM")))));
    };

    openModal() {
        UI.showConfirmationModal("Implizite Beziehungen", React.createElement(this.List, { plugin: this }), { confirmText: "Schließen", cancelText: null });
    }

    getSettingsPanel() { return React.createElement(this.List, { plugin: this }); }
};
