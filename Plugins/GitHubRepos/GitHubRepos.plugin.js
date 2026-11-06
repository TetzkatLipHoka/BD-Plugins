/**
 * @name GitHubRepos
 * @author talhakf, Panniku, benjii (Equicord) · BD-Port (vereinfacht)
 * @version 1.0.3
 * @description Right-click a user with a linked GitHub account → "GitHub repositories" shows their public repos (sorted by stars, with language and description). Simplified port of the Equicord plugin (window instead of profile tab).
 * @source https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/githubRepos
 * @website https://github.com/TetzkatLipHoka/BD-Plugins
 * @updateUrl https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/GitHubRepos/GitHubRepos.plugin.js
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
})(new BdApi("GitHubRepos"));
//#endregion Updater

const { Webpack, ContextMenu, React, DOM, Data, UI, Logger, Utils } = new BdApi("GitHubRepos");
const { useState, useEffect, useMemo } = React;

const DEFAULTS = { perPage: 30, hideForks: false };

const LANG_COLORS = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", "C#": "#178600", "C++": "#f34b7d", C: "#555555",
    Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Lua: "#000080",
    Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Svelte: "#ff3e00", Pascal: "#E3F171", Delphi: "#E3F171",
    "Objective-C": "#438eff", Scala: "#c22d40", Haskell: "#5e5086", Elixir: "#6e4a7e", Zig: "#ec915c", Nix: "#7e7eff", GDScript: "#355570"
};

const CSS = `
.bd-gh-wrap { display: flex; flex-direction: column; gap: 10px; min-width: 460px; }
.bd-gh-head { display: flex; align-items: center; gap: 10px; color: var(--text-default, var(--text-normal)); }
.bd-gh-head img { width: 40px; height: 40px; border-radius: 50%; }
.bd-gh-head a { color: var(--text-link); font-weight: 600; }
.bd-gh-tools { display: flex; gap: 8px; align-items: center; }
.bd-gh-search { flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--input-border-default, var(--background-modifier-accent));
  background: var(--input-background-default, var(--input-background)); color: var(--text-default, var(--text-normal)); }
.bd-gh-sort { background: var(--button-secondary-background, #4e5058); color: #fff; border: 0; border-radius: 4px; padding: 6px 10px; cursor: pointer; }
.bd-gh-list { max-height: 55vh; overflow-y: auto; display: grid; grid-template-columns: 1fr; gap: 6px; }
.bd-gh-card { padding: 10px 12px; border-radius: 8px; background: var(--background-base-lower, var(--background-secondary)); cursor: pointer; border: 1px solid transparent; }
.bd-gh-card:hover { border-color: var(--brand-500, #5865f2); }
.bd-gh-name { font-weight: 600; color: var(--text-strong, var(--header-primary)); }
.bd-gh-fork { font-size: 11px; color: var(--text-muted); margin-left: 6px; }
.bd-gh-desc { color: var(--text-muted); font-size: 13px; margin-top: 3px; }
.bd-gh-meta { display: flex; gap: 14px; font-size: 12px; color: var(--text-muted); margin-top: 6px; align-items: center; }
.bd-gh-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; vertical-align: -1px; }
.bd-gh-msg { color: var(--text-muted); padding: 12px 0; }
`;

function ghAccount(profile) {
    return profile?.connectedAccounts?.find(c => c.type === "github") ?? null;
}

module.exports = class GitHubRepos {
    constructor() { this.unpatches = []; this.cache = new Map(); }
    get s() { return Object.assign({}, DEFAULTS, Data.load("settings")); }

    start() {
        this.__updater = new UpdateManager("GitHubRepos", BdApi.Plugins.get("GitHubRepos")?.version ?? "0.0.0", "TetzkatLipHoka/BD-Plugins");
        this.__updater.start(true);
        DOM.addStyle(CSS);
        this.UserProfileStore = Webpack.getStore("UserProfileStore");
        this.UserStore = Webpack.getStore("UserStore");
        this.unpatches.push(ContextMenu.patch("user-context", (tree, { user }) => {
            if (!user) return;
            const acc = ghAccount(this.UserProfileStore.getUserProfile(user.id));
            if (!acc) return;
            const item = ContextMenu.buildItem({ id: "bd-gh-repos", label: "GitHub repositories", action: () => this.openModal(user, acc) });
            const menu = Utils.findInTree(tree, n => n?.props?.navId, { walkable: ["props", "children"] }) ?? tree;
            const c = menu?.props?.children;
            if (Array.isArray(c)) c.push(item); else if (menu?.props) menu.props.children = [c, item];
        }));
    }

    stop() {
        this.__updater?.stop(); this.unpatches.forEach(u => u()); this.unpatches = []; DOM.removeStyle(); }

    async fetchRepos(acc) {
        const key = acc.id + ":" + this.s.perPage;
        if (this.cache.has(key)) return this.cache.get(key);
        const per = Math.min(Math.max(this.s.perPage, 1), 100);
        const urls = [
            `https://api.github.com/user/${acc.id}/repos?sort=updated&per_page=${per}`,
            `https://api.github.com/users/${encodeURIComponent(acc.name)}/repos?sort=updated&per_page=${per}`
        ];
        let lastErr;
        for (const url of urls) {
            try {
                const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
                if (res.status === 403) throw new Error("GitHub rate limit reached (60 requests/hour without login) – try again later.");
                if (!res.ok) { lastErr = new Error(`GitHub responded with ${res.status}`); continue; }
                const data = await res.json();
                this.cache.set(key, data);
                return data;
            } catch (e) { lastErr = e; if (String(e.message).includes("Rate-Limit")) break; }
        }
        throw lastErr ?? new Error("Unknown error");
    }

    View = ({ plugin, user, acc }) => {
        const [repos, setRepos] = useState(null);
        const [err, setErr] = useState(null);
        const [q, setQ] = useState("");
        const [sort, setSort] = useState("stars");
        useEffect(() => { plugin.fetchRepos(acc).then(setRepos, e => { Logger.error(e); setErr(e.message); }); }, []);

        const shown = useMemo(() => {
            if (!repos) return [];
            const s = q.toLowerCase();
            return repos.filter(r => (!plugin.s.hideForks || !r.fork) && (!s || r.name.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s) || r.language?.toLowerCase().includes(s)))
                .sort(sort === "stars" ? (a, b) => b.stargazers_count - a.stargazers_count : sort === "name" ? (a, b) => a.name.localeCompare(b.name) : (a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
        }, [repos, q, sort]);

        const sortLabel = { stars: "★ Stars", name: "A–Z", pushed: "Recently pushed" };
        const nextSort = { stars: "name", name: "pushed", pushed: "stars" };
        const owner = repos?.[0]?.owner;

        return React.createElement("div", { className: "bd-gh-wrap" },
            React.createElement("div", { className: "bd-gh-head" },
                owner?.avatar_url && React.createElement("img", { src: owner.avatar_url }),
                React.createElement("a", { href: `https://github.com/${acc.name}`, target: "_blank", rel: "noreferrer" }, "github.com/" + acc.name),
                repos && React.createElement("span", { style: { color: "var(--text-muted)" } }, `· ${repos.length} repos loaded`)),
            React.createElement("div", { className: "bd-gh-tools" },
                React.createElement("input", { className: "bd-gh-search", placeholder: "Name, description or language …", value: q, onChange: e => setQ(e.target.value) }),
                React.createElement("button", { className: "bd-gh-sort", onClick: () => setSort(nextSort[sort]) }, sortLabel[sort])),
            err ? React.createElement("div", { className: "bd-gh-msg" }, "Error: " + err)
                : !repos ? React.createElement("div", { className: "bd-gh-msg" }, "Loading repositories …")
                    : !shown.length ? React.createElement("div", { className: "bd-gh-msg" }, "No public repositories found.")
                        : React.createElement("div", { className: "bd-gh-list" }, shown.map(r =>
                            React.createElement("div", { className: "bd-gh-card", key: r.id, onClick: () => window.open(r.html_url, "_blank") },
                                React.createElement("div", null, React.createElement("span", { className: "bd-gh-name" }, r.name), r.fork && React.createElement("span", { className: "bd-gh-fork" }, "Fork")),
                                r.description && React.createElement("div", { className: "bd-gh-desc" }, r.description),
                                React.createElement("div", { className: "bd-gh-meta" },
                                    r.language && React.createElement("span", null, React.createElement("span", { className: "bd-gh-dot", style: { background: LANG_COLORS[r.language] ?? "#8b949e" } }), r.language),
                                    React.createElement("span", null, "★ " + r.stargazers_count.toLocaleString()),
                                    r.pushed_at && React.createElement("span", null, "updated " + new Date(r.pushed_at).toLocaleDateString()))))));
    };

    openModal(user, acc) {
        UI.showConfirmationModal(`GitHub – ${user.globalName ?? user.global_name ?? user.username}`,
            React.createElement(this.View, { plugin: this, user, acc }), { confirmText: "Close", cancelText: null });
    }

    getSettingsPanel() {
        const s = this.s;
        return UI.buildSettingsPanel({
            settings: [
                { type: "slider", id: "perPage", name: "Number of repos to load", note: "Max. 100 (one GitHub request)", min: 10, max: 100, step: 10, value: s.perPage, markers: [10, 30, 50, 100] },
                { type: "switch", id: "hideForks", name: "Hide forks", value: s.hideForks }
            ],
            onChange: (_c, id, v) => { Data.save("settings", { ...this.s, [id]: v }); this.cache.clear(); }
        });
    }
};
