/**
 * @name PauseInvitesForever
 * @author Dolfies, amia (Vencord) · BD-Port
 * @version 1.0.2
 * @description Brings back the option to pause invites indefinitely in the "Pause invites" dialog. Port of the Vencord plugin.
 * @source https://github.com/Vendicated/Vencord/tree/main/src/plugins/pauseInvitesForever
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/PauseInvitesForever/PauseInvitesForever.plugin.js
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
})(new BdApi("PauseInvitesForever"));
//#endregion Updater

const { Webpack, Patcher, React, DOM, UI, Logger } = new BdApi("PauseInvitesForever");

const CSS = `
.bd-pif-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,.08)); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.bd-pif-row span { color: var(--text-muted); font-size: 14px; }
.bd-pif-btn { background: var(--button-danger-background, #da373c); color: #fff; border: 0; border-radius: 4px; padding: 6px 12px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.bd-pif-btn:hover { filter: brightness(1.1); }
`;

module.exports = class PauseInvitesForever {
    start() {
        this.__updater = new UpdateManager("PauseInvitesForever", BdApi.Plugins.get("PauseInvitesForever")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        this.GuildStore = Webpack.getStore("GuildStore");
        this.PermissionStore = Webpack.getStore("PermissionStore");
        this.RestAPI = Webpack.getModule(m => typeof m === "object" && m.del && m.put && m.patch, { searchExports: true });
        this.abort = new AbortController();

        // Dialog module (GUILD_INVITE_DISABLE_ACTION_SHEET_DESCRIPTION = qPJkZh) is lazy-loaded
        const filter = m => typeof m?.default === "function" && String(m.default).includes("qPJkZh");
        const existing = Webpack.getModule(filter, { defaultExport: false });
        if (existing) this.patch(existing);
        else Webpack.waitForModule(filter, { defaultExport: false, signal: this.abort.signal }).then(m => m && this.patch(m)).catch(() => {});
    }

    stop() {
        this.__updater?.stop(); this.abort?.abort(); Patcher.unpatchAll(); DOM.removeStyle(); }

    canPause(guild) {
        if (!guild) return false;
        const features = guild.features;
        const disabled = typeof features?.has === "function" ? features.has("INVITES_DISABLED") : features?.includes?.("INVITES_DISABLED");
        if (disabled) return false;
        try { return !!this.PermissionStore.getGuildPermissionProps(guild).canManageRoles; } catch { return true; }
    }

    async pauseForever(guildId, onClose) {
        const guild = this.GuildStore.getGuild(guildId);
        const features = [...new Set([...(guild?.features ?? []), "INVITES_DISABLED"])];
        try {
            await this.RestAPI.patch({ url: `/guilds/${guildId}`, body: { features } });
            UI.showToast("Invites paused indefinitely", { type: "success" });
            onClose?.();
        } catch (e) {
            Logger.error(e);
            UI.showToast("Pausing failed: " + (e?.body?.message ?? e?.message ?? "unknown"), { type: "error" });
        }
    }

    patch(mod) {
        Patcher.after(mod, "default", (_, [props], ret) => {
            try {
                const guild = this.GuildStore.getGuild(props?.guildId);
                if (!this.canPause(guild)) return;
                const body = ret?.props?.children;            // <div className=…> with select + switches
                const list = body?.props?.children;
                if (!Array.isArray(list)) return;
                list.push(React.createElement("div", { className: "bd-pif-row", key: "bd-pif" },
                    React.createElement("span", null, "Pause without an end date (until you re-enable them)"),
                    React.createElement("button", { className: "bd-pif-btn", onClick: () => this.pauseForever(props.guildId, props.onClose) }, "Pause indefinitely")
                ));
            } catch (e) { Logger.error(e); }
        });
    }
};
