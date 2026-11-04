# MoreQuickReactions

Discord shows four quick reactions at the top of the message context menu. This plugin shows up to 30, in a grid you can configure.

**Port type:** Simplified. No scrolling, and the hover toolbar stays unchanged.

## Features

- 4 to 30 quick reactions (10 by default)
- Configurable number of columns
- Optionally fills the list with your most used reactions instead of your favorites

## Installation

1. Download [MoreQuickReactions.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MoreQuickReactions/MoreQuickReactions.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Right-click a message: the reactions at the top of the menu are now a grid.

## Settings

Under **User Settings → BetterDiscord → Plugins → MoreQuickReactions** (cog icon):

- **Number of quick reactions** (10): 4 to 30
- **Columns** (5): 3 to 10
- **Frequently used instead of favorites** (off)

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/moreQuickReactions) by Equicord/Vencord-Team
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
