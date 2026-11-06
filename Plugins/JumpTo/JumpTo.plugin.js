/**
 * @name JumpTo
 * @author Samwich, thororen (Equicord) · BD-Port
 * @version 1.0.3
 * @description Context menu: jump to the first/last message of a channel/DM, or to a user's first/last message in the channel. Port of the Equicord plugin.
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/jumpTo
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/JumpTo/JumpTo.plugin.js
 */
/* SPDX-License-Identifier: GPL-3.0-or-later — based on Vencord/Equicord code */
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
})(new BdApi("JumpTo"));
//#endregion Updater

const { ContextMenu, Webpack, UI, Logger, Utils } = new BdApi("JumpTo");
const { Filters } = Webpack;

module.exports = class JumpTo {
    constructor(meta) { this.meta = meta; this.unpatches = []; }

    start() {
        this.__updater = new UpdateManager("JumpTo", BdApi.Plugins.get("JumpTo")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        this.ChannelStore = Webpack.getStore("ChannelStore");
        this.SelectedChannelStore = Webpack.getStore("SelectedChannelStore");
        this.SelectedGuildStore = Webpack.getStore("SelectedGuildStore");
        this.RestAPI = Webpack.getModule(m => typeof m === "object" && m.del && m.put && m.get, { searchExports: true });
        this.transitionTo = Webpack.getModule(Filters.byStrings("transitionTo - Transitioning to"), { searchExports: true });

        if (!this.RestAPI || !this.transitionTo) {
            UI.showToast("JumpTo: required Discord modules not found", { type: "error" });
            Logger.error("Missing modules", { RestAPI: !!this.RestAPI, transitionTo: !!this.transitionTo });
            return;
        }

        const chan = (tree, props) => this.channelMenu(tree, props);
        for (const id of ["channel-context", "gdm-context", "thread-context"]) this.unpatches.push(ContextMenu.patch(id, chan));
        this.unpatches.push(ContextMenu.patch("user-context", (t, p) => this.userMenu(t, p)));
        this.unpatches.push(ContextMenu.patch("message", (t, p) => this.messageMenu(t, p)));
    }

    stop() {
        this.__updater?.stop(); this.unpatches.forEach(u => u()); this.unpatches = []; }

    push(tree, items) {
        const built = items.map(i => ContextMenu.buildItem(i));
        const menu = Utils.findInTree(tree, n => n?.props?.navId, { walkable: ["props", "children"] }) ?? tree;
        const c = menu?.props?.children;
        if (Array.isArray(c)) c.push(...built);
        else if (menu?.props) menu.props.children = [c, ...built];
    }

    jumpFirst(channelId, guildId) { this.transitionTo(`/channels/${guildId ?? "@me"}/${channelId}/0`); }

    async jumpLast(channelId, guildId) {
        try {
            const res = await this.RestAPI.get({ url: `/channels/${channelId}/messages`, query: { limit: 1 } });
            const id = res.body?.[0]?.id;
            if (id) this.transitionTo(`/channels/${guildId ?? "@me"}/${channelId}/${id}`);
        } catch (e) { Logger.error(e); UI.showToast("Could not load the last message.", { type: "error" }); }
    }

    async jumpUser(channelId, guildId, userId, first) {
        try {
            const res = await this.RestAPI.get({
                url: `/guilds/${guildId}/messages/search`,
                query: { author_id: userId, channel_id: channelId, sort_by: "timestamp", sort_order: first ? "asc" : "desc" }
            });
            const id = res.body?.messages?.[0]?.[0]?.id;
            if (!id) return UI.showToast("No messages from this user in this channel.", { type: "error" });
            this.transitionTo(`/channels/${guildId}/${channelId}/${id}`);
        } catch (e) { Logger.error(e); UI.showToast("Search failed.", { type: "error" }); }
    }

    channelItems(c) {
        return [
            { id: "jt-first", label: "Jump to first message", action: () => this.jumpFirst(c.id, c.guild_id) },
            { id: "jt-last", label: "Jump to last message", action: () => this.jumpLast(c.id, c.guild_id) }
        ];
    }

    channelMenu(tree, { channel, thread }) {
        const selId = this.SelectedChannelStore.getChannelId();
        const sel = selId ? this.ChannelStore.getChannel(selId) : null;
        const forumChild = channel?.isForumLikeChannel?.() && sel?.isThread?.() && sel.parent_id === channel.id ? sel : null;
        const target = thread ?? forumChild ?? channel;
        if (target) this.push(tree, this.channelItems(target));
    }

    userMenu(tree, { user, channel }) {
        if (!user || !channel || channel.guild_id) return;
        this.push(tree, this.channelItems({ id: channel.id, guild_id: null }));
    }

    messageMenu(tree, { message }) {
        if (!message) return;
        const channelId = this.SelectedChannelStore.getChannelId();
        const guildId = this.SelectedGuildStore.getGuildId();
        if (!channelId || !guildId) return;
        this.push(tree, [
            { id: "jt-first-user", label: "Jump to this user's first message", action: () => this.jumpUser(channelId, guildId, message.author.id, true) },
            { id: "jt-last-user", label: "Jump to this user's last message", action: () => this.jumpUser(channelId, guildId, message.author.id, false) }
        ]);
    }
};
