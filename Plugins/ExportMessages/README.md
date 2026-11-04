# ExportMessages

Saves any message to a text file, and can copy your contact list to the clipboard.

**Port type:** Full. Behaves like the original.

## Features

- **Export message** in the message context menu, with a save dialog
- The file contains timestamp, author and text, plus attachment names and URLs and embed titles, descriptions and URLs
- Copies friends, blocked users and pending requests to the clipboard as JSON
- The contact list is read from the local store, with no extra API request

## Installation

1. Download [ExportMessages.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ExportMessages/ExportMessages.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

1. Right-click a message → **Export message**, then pick where to save `message-<id>-<date>.txt`
2. For the contact list: plugin settings → **Copy contact list to clipboard**

## Settings

Under **User Settings → BetterDiscord → Plugins → ExportMessages** (cog icon):

- **Show the file in Explorer after exporting** (on)
- **Copy contact list to clipboard**: button

## Notes

- Attachments are listed with their URLs, not downloaded.
- The contact list only names users Discord has cached locally, so it can be shorter than your real list.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/exportMessages) by veygax, dat_insanity
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
