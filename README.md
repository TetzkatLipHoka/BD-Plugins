# Equicord → BetterDiscord Ports

![plugins](https://img.shields.io/badge/plugins-18-5865F2) ![BetterDiscord](https://img.shields.io/badge/BetterDiscord-1.14.4-3E82E5) ![license](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)

A collection of **18 plugins** ported from [Equicord](https://github.com/Equicord/Equicord) / [Vencord](https://github.com/Vendicated/Vencord) to [BetterDiscord](https://betterdiscord.app).

Every plugin is a single self-contained `.plugin.js` file: no ZeresPluginLibrary, no BDFDB, no other dependencies. Every plugin also **updates itself** from this repository.

> Tested on **BetterDiscord 1.14.4**, Discord Stable **1.0.9266** (Chrome 152 / Electron 44), Windows, November 2026.
> Discord changes its internals all the time, so a client update can break individual plugins.

---

## Installation

1. Download the plugins you want. Use the **Download** links in the tables below (right-click → *Save link as…*), or grab everything at once via **Code → Download ZIP**.
2. Put the files into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable them under **User Settings → BetterDiscord → Plugins**.

Most plugins have a settings panel (cog next to the plugin's toggle).

### Automatic updates

Every plugin checks this repository for a newer version **15 seconds after start and then once a day**. When one is found, a BetterDiscord notification offers **Update / Dismiss**. On update, the new file is validated (matching `@name`, a `@version`, `module.exports`, `@updateUrl`), written over the old one, and the plugin reloads itself. After an update, a changelog of everything new since your previous version is shown, taken from the plugin's `CHANGELOG.md`.

The updater is [Pharaoh2k](https://github.com/Pharaoh2k)'s `UpdateManager`, used with permission (see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)).

---

## Plugins

**Port types used in the tables below:**
- **Full** behaves like the original.
- **Partial** contains only part of the original's features.
- **Simplified** offers the same functionality through a different UI, because the original's hook points can't be reached from BD.

### Chat & messages

| Plugin | Type | What it does |
|---|---|---|
| **[ReplyTimestamp](Plugins/ReplyTimestamp)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ReplyTimestamp/ReplyTimestamp.plugin.js) | Full | Shows the time of the original message in reply previews, e.g. `[14:32]`. Shows date and time if it's from another day. |
| **[MessageLatency](Plugins/MessageLatency)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MessageLatency/MessageLatency.plugin.js) | Full | Adds a small signal icon to messages that took ≥ *n* seconds to arrive. The tooltip shows the delay, flags a sender whose clock is ahead, and flags old Android clients. Configurable threshold. |
| **[FullUserInChatbox](Plugins/FullUserInChatbox)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/FullUserInChatbox/FullUserInChatbox.plugin.js) | Full | @mentions inside the message box become real mentions: left-click opens the profile, right-click the user context menu. Takes effect after switching channels once. |
| **[ExportMessages](Plugins/ExportMessages)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ExportMessages/ExportMessages.plugin.js) | Full | Message context menu → **Export message** saves it as `.txt` with attachments and embeds. The settings panel can copy your contact list (friends, blocked, pending requests) to the clipboard as JSON. Read from the local store, no extra API request. |
| **[JumpTo](Plugins/JumpTo)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/JumpTo/JumpTo.plugin.js) | Full | Context menu on channels, threads, group DMs and DM users → jump to the **first/last message**. On a message → jump to that user's first/last message in the channel. |
| **[FullSearchContext](Plugins/FullSearchContext)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/FullSearchContext/FullSearchContext.plugin.js) | Full | Right-clicking a search result opens the **full** message context menu, including entries added by other plugins, plus **Copy author ID**. |
| **[MoreQuickReactions](Plugins/MoreQuickReactions)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MoreQuickReactions/MoreQuickReactions.plugin.js) | Simplified | More quick reactions at the top of the message context menu: 10 by default, up to 30, in a configurable grid. Can use your frequently used emojis instead of favorites. No scrolling, and the hover toolbar is unchanged. |

### Voice & streaming

| Plugin | Type | What it does |
|---|---|---|
| **[VoiceChatUtilities](Plugins/VoiceChatUtilities)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/VoiceChatUtilities/VoiceChatUtilities.plugin.js) | Full | Right-click a voice/stage channel → **Voice Tools**: mention everyone, disconnect, (un)mute, (un)deafen or move all users. Requests run **sequentially** with configurable pauses to avoid rate limits; the original fired them all at once. |
| **[BiggerStreamPreview](Plugins/BiggerStreamPreview)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BiggerStreamPreview/BiggerStreamPreview.plugin.js) | Full | User/stream context menu → **View stream preview** in a large modal. |

### Servers & moderation

| Plugin | Type | What it does |
|---|---|---|
| **[ShowTimeoutDuration](Plugins/ShowTimeoutDuration)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ShowTimeoutDuration/ShowTimeoutDuration.plugin.js) | Full | Live countdown of the remaining timeout, next to the timeout icon or in its tooltip. |
| **[PauseInvitesForever](Plugins/PauseInvitesForever)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/PauseInvitesForever/PauseInvitesForever.plugin.js) | Full | Adds a **Pause indefinitely** button to the "Pause invites" dialog. Discord now only offers timed pauses there. Requires the relevant permission. |

### Profiles & relationships

| Plugin | Type | What it does |
|---|---|---|
| **[BetterBlockedUsers](Plugins/BetterBlockedUsers)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterBlockedUsers/BetterBlockedUsers.plugin.js) | Partial | Skips the "view profile anyway?" prompt for blocked users. Ignored users still ask. Adds a **searchable blocked-user list** with a profile button (settings-menu entry or plugin settings). *Not ported:* merging consecutive "blocked message" rows. |
| **[UnlockedAvatarZoom](Plugins/UnlockedAvatarZoom)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/UnlockedAvatarZoom/UnlockedAvatarZoom.plugin.js) | Full | Zoom up to 16× (instead of 2×) in the avatar/banner crop tool. The maximum is configurable. |
| **[ImplicitRelationships](Plugins/ImplicitRelationships)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ImplicitRelationships/ImplicitRelationships.plugin.js) | Simplified | Lists people Discord thinks you interact with a lot but who aren't your friends, ranked by affinity, with profile and DM buttons. Opens as its own window instead of an extra friends-list tab. |
| **[GitHubRepos](Plugins/GitHubRepos)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/GitHubRepos/GitHubRepos.plugin.js) | Simplified | Right-click a user with a linked GitHub account → **GitHub repositories**: a window with search, sorting (stars / name / last push), languages and descriptions. Replaces the original's profile tab. The entry appears once Discord has loaded that user's profile. |

### Account & notifications

| Plugin | Type | What it does |
|---|---|---|
| **[ToastNotifications](Plugins/ToastNotifications)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ToastNotifications/ToastNotifications.plugin.js) | Full | In-app toast pop-ups for new messages, rendered with Discord's own message component. Respects mute and notification settings. Configurable position, duration, opacity and filters, with a test button. Left-click jumps to the message, right-click marks it as read. |
| **[BetterSessions](Plugins/BetterSessions)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterSessions/BetterSessions.plugin.js) | Simplified | Checks for **new login sessions** in the background and notifies you. A window lists all sessions with exact last-used times and lets you give each one a custom name. Discord's own "Devices" page is not modified. |
| **[NoNitroUpsell](Plugins/NoNitroUpsell)** · [Download](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/NoNitroUpsell/NoNitroUpsell.plugin.js) | Full | Hides Nitro upsells by locally setting the client's premium-type override. ⚠ May interfere with YABDP4Nitro, so use one or the other. |

**Settings menu** means right-clicking the **settings cog** in the bottom-left user panel. Its internal navId is `settings-menu`, formerly `user-settings-cog`. BetterBlockedUsers, ImplicitRelationships and BetterSessions add their entries there.

---

## Repository layout

```
Plugins/
  <PluginName>/
    <PluginName>.plugin.js   ← the plugin (this exact path is what the updater fetches)
    CHANGELOG.md             ← "### x.y.z" headings + "- item" lines, shown after updates
LICENSE                      ← GPL-3.0
THIRD_PARTY_NOTICES.md       ← UpdateManager permission notice
```

**Releasing an update:** bump `@version` in the plugin header, add a `### x.y.z` section at the top of its `CHANGELOG.md`, and push to `main`. Installed copies pick it up within a day. The version is read from the header at runtime, so nothing else needs changing.

---

## How the ports work

Vencord plugins mostly use `patches`: regex replacements on Discord's webpack source before it runs. BetterDiscord can't do that, so these ports use other techniques:

- **`BdApi.Patcher`** on exported functions and components, mostly `after`-patches that adjust the returned React tree.
- **React-tree edits** that locate elements by stable props, e.g. the avatar crop slider by `minValue: 1, maxValue: 2, keyboardStep: 0.025`.
- **`Webpack.waitForModule`** for lazily loaded chunks such as dialogs and the image cropper.
- **Flux subscriptions** (`MESSAGE_CREATE`, `CONNECTION_OPEN`) and stores instead of patches wherever possible.
- **DOM-level interception** where the original patches a class field that can't be reached from outside, as in FullSearchContext.
- **Hashed intl keys:** Discord ships its translation keys as 6-character hashes (xxhash64 → base64, see Equicord's `runtimeHashMessageKey`). The module filters search for those hashes, e.g. `REPLY_QUOTE_MESSAGE_NOT_LOADED` → `1i+hMi`.
- **MoreQuickReactions trick:** Discord hard-truncates the reaction list with `i.length = 4`. The plugin returns an `Array` subclass whose `Symbol.species` makes `filter()` produce a `Proxy` that only lets the length shrink down to the configured limit.

---

## Not ported

| Original | Reason |
|---|---|
| BetterCommands | The auto-fill logic lives in a closure inside the slash-command editor and can't be reached without source patching. |
| ShikiCodeblocks | No working alternative right now. The third-party `enhancecodeblocks` breaks on current Discord because highlight.js is now lazy-loaded. |
| MessageLogger, ShowHiddenChannels, Questify | Deeply invasive, and they conflict with the [BD plugin guidelines](https://docs.betterdiscord.app/plugins/publishing/guidelines) (deleted messages, hidden channels, auto-completing quests). |
| CommandPalette, MoreStickers | Large (thousands of lines of UI / file access). Maybe later. |

---

## Known BetterDiscord issue (not caused by these plugins)

In BD 1.14.4 on current Discord, settings dropdowns (`.bd-select`) open in the bottom-right corner of the window instead of under the select, because the implicit popover anchor doesn't apply. Until it's fixed upstream, add this to your **Custom CSS**:

```css
.bd-select:has(+ .bd-select-options:popover-open) { anchor-name: --bd-select-fix; }
.bd-select-options:popover-open { position-anchor: --bd-select-fix; }
```

---

## Reporting problems

Open an issue with:
- the plugin name and version (from the file header),
- your BetterDiscord version (*Settings → BetterDiscord → Updater → Core*),
- the console output (`Ctrl+Shift+I`, filter by the plugin name).

Each plugin logs a toast and a console error if it can't find the Discord module it needs, which is usually the first sign that a Discord update changed something.

---

## Credits & license

All credit for the original features goes to the **Vencord** and **Equicord** developers. The original authors are listed in each file's `@author` header, and `@source` links to the original plugin.

The auto-updater (`UpdateManager`) is by **Pharaoh2k** ([BetterDiscordStuff](https://github.com/Pharaoh2k/BetterDiscordStuff)), used with his permission. His suggestions also shaped this collection.

These ports were written with AI assistance (Claude). Because of that, and because they're derived from other people's plugins, they aren't eligible for the official BetterDiscord plugin store.

The plugin code is licensed under **GPL-3.0-or-later**, the same as the original code. See [`LICENSE`](LICENSE). The embedded `UpdateManager` remains © Pharaoh2k and is included with permission; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

> **Disclaimer:** Client modifications violate Discord's Terms of Service. Use at your own risk.
