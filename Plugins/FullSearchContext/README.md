# FullSearchContext

Right-clicking a search result normally gives you very little. This plugin opens the full message context menu instead.

**Port type:** Full. Behaves like the original.

## Features

- The complete message context menu on search results, including entries added by other plugins
- An extra **Copy author ID** entry

## Installation

1. Download [FullSearchContext.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/FullSearchContext/FullSearchContext.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Search for something and right-click a result.

## Settings

This plugin has no settings of its own.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. It waits for the Discord code it needs, so it then simply has no effect, without an error toast. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/fullSearchContext) by Ven, Aria
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
