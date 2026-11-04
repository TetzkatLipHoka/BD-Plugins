# ReplyTimestamp

Shows when the original message was sent, right in the reply preview above a reply. No more scrolling up to find out whether someone is replying to something from a minute ago or from last year.

**Port type:** Full. Behaves like the original.

## Features

- Time of the original message in every reply preview, e.g. `[14:32]`
- Date and time instead if the original is from a different day than the reply
- Hover for the full date and time
- Uses your system's date and time format

## Installation

1. Download [ReplyTimestamp.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ReplyTimestamp/ReplyTimestamp.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Nothing to do: enable the plugin and timestamps appear in reply previews.

## Settings

This plugin has no settings of its own.

## Notes

- Replies whose original message could not be loaded or was deleted show no timestamp.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/replyTimestamp) by Kyuuhachi
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
