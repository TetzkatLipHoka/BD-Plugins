# BetterSessions

Checks for new login sessions in the background and warns you, so a login you don't recognize doesn't go unnoticed. A separate window lists all sessions with their exact last-used time.

**Port type:** Simplified. Uses its own window. Discord's "Devices" page is not modified.

## Features

- Notification for each new session, with OS, platform and location
- All sessions sorted by last activity, with a **NEW** badge on new ones
- A custom name for each session, saved per account

## Installation

1. Download [BetterSessions.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterSessions/BetterSessions.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

1. Right-click the **settings cog** in the bottom-left user panel → **Sessions**
2. Type a custom name next to a session and press Enter

## Settings

Under **User Settings → BetterDiscord → Plugins → BetterSessions** (cog icon):

- **Check for new sessions in the background** (on)
- **Check interval (minutes)** (20)

## Notes

- On first start, existing sessions are adopted silently, so you don't get a flood of notifications.
- Changes to the settings take effect after restarting the plugin.
- To log a session out, use Discord's own "Devices" page.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/betterSessions) by amia
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
