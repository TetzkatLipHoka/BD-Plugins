/**
 * @name ExportMessages
 * @author veygax, dat_insanity (Equicord) · BD-Port
 * @version 1.0.2
 * @description Right-click a message → export it as .txt. Plugin settings: copy your contact list (friends, blocked, requests) to the clipboard as JSON. Port of the Equicord plugin.
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/exportMessages
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ExportMessages/ExportMessages.plugin.js
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
})(new BdApi("ExportMessages"));
//#endregion Updater

const { ContextMenu, Webpack, Data, UI, React, Logger } = new BdApi("ExportMessages");

const DEFAULTS = { openFileAfterExport: true };

function toDate(ts) {
    if (ts instanceof Date) return ts;
    if (typeof ts?.toDate === "function") return ts.toDate();
    return new Date(ts?.toString?.() ?? ts);
}

function userTag(u) { return u.discriminator && u.discriminator !== "0" ? `${u.username}#${u.discriminator}` : u.username; }

function formatMessage(message) {
    const { author } = message;
    let content = `[${toDate(message.timestamp).toLocaleString()}] ${userTag(author)}: ${message.content}`;
    if (message.attachments?.length) {
        content += "\n  Attachments:";
        for (const a of message.attachments) content += `\n    - ${a.filename} (${a.url})`;
    }
    if (message.embeds?.length) {
        content += "\n  Embeds:";
        for (const e of message.embeds) {
            if (e.rawTitle) content += `\n    Title: ${e.rawTitle}`;
            if (e.rawDescription) content += `\n    Description: ${e.rawDescription}`;
            if (e.url) content += `\n    URL: ${e.url}`;
        }
    }
    return content;
}

module.exports = class ExportMessages {
    constructor() { this.unpatches = []; }
    get settings() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("ExportMessages", BdApi.Plugins.get("ExportMessages")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        this.RelationshipStore = Webpack.getStore("RelationshipStore");
        this.UserStore = Webpack.getStore("UserStore");
        this.unpatches.push(ContextMenu.patch("message", (tree, { message }) => {
            if (!message) return;
            const item = ContextMenu.buildItem({ id: "bd-export-message", label: "Export message", action: () => this.exportMessage(message) });
            const c = tree?.props?.children;
            if (Array.isArray(c)) c.push(item); else if (tree?.props) tree.props.children = [c, item];
        }));
    }

    stop() {
        this.__updater?.stop(); this.unpatches.forEach(u => u()); this.unpatches = []; }

    async exportMessage(message) {
        const date = toDate(message.timestamp).toISOString().split("T")[0];
        const filename = `message-${message.id}-${date}.txt`;
        const content = formatMessage(message);
        try {
            const fm = window.DiscordNative?.fileManager;
            if (fm?.saveWithDialog) {
                const result = await fm.saveWithDialog(new TextEncoder().encode(content), filename);
                if (result && this.settings.openFileAfterExport) fm.showItemInFolder?.(result);
                if (result) UI.showToast(`Exported: ${filename}`, { type: "success" });
            } else {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
                a.download = filename; a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            }
        } catch (e) {
            Logger.error(e);
            UI.showToast("Export failed", { type: "error" });
        }
    }

    getContacts() {
        const RS = this.RelationshipStore;
        let entries = [];
        const mut = RS?.getMutableRelationships?.();
        if (mut instanceof Map) entries = [...mut.entries()].map(([id, r]) => [id, typeof r === "object" ? r.type : r]);
        else if (mut && typeof mut === "object") entries = Object.entries(mut).map(([id, r]) => [id, typeof r === "object" ? r.type : r]);
        else entries = Object.entries(RS?.getRelationships?.() ?? {}).map(([id, r]) => [id, typeof r === "object" ? r.type : r]);

        const names = type => entries.filter(([, t]) => t === type)
            .map(([id]) => this.UserStore.getUser(id)).filter(Boolean).map(userTag);
        return {
            friendsAdded: names(1),
            blockedUsers: names(2),
            incomingFriendRequests: names(3),
            outgoingFriendRequests: names(4)
        };
    }

    copyContacts() {
        try {
            const list = this.getContacts();
            const text = JSON.stringify(list, null, 2);
            if (window.DiscordNative?.clipboard?.copy) window.DiscordNative.clipboard.copy(text);
            else navigator.clipboard.writeText(text);
            UI.showToast(`Contacts copied (${list.friendsAdded.length} friends, ${list.blockedUsers.length} blocked)`, { type: "success" });
        } catch (e) { Logger.error(e); UI.showToast("Could not read contacts", { type: "error" }); }
    }

    getSettingsPanel() {
        const s = this.settings;
        const panel = UI.buildSettingsPanel({
            settings: [
                { type: "switch", id: "openFileAfterExport", name: "Show the file in Explorer after exporting", value: s.openFileAfterExport }
            ],
            onChange: (_c, id, v) => Data.save("settings", { ...this.settings, [id]: v })
        });
        return React.createElement("div", null,
            panel,
            React.createElement("button", {
                onClick: () => this.copyContacts(),
                style: { marginTop: 16, background: "var(--brand-500, #5865f2)", color: "#fff", border: 0, borderRadius: 4, padding: "8px 14px", fontWeight: 500, cursor: "pointer" }
            }, "Copy contact list to clipboard"));
    }
};
