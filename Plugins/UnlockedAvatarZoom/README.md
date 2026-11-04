# UnlockedAvatarZoom

Lets you zoom further into an image in Discord's avatar and banner crop tool, which normally stops at 2×.

**Port type:** Full. Behaves like the original.

## Features

- Crop tool zoom up to 16×, with a configurable maximum

## Installation

1. Download [UnlockedAvatarZoom.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/UnlockedAvatarZoom/UnlockedAvatarZoom.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Upload an avatar or banner and use the zoom slider as usual: it now goes further.

## Settings

Under **User Settings → BetterDiscord → Plugins → UnlockedAvatarZoom** (cog icon):

- **Maximum zoom** (4): 2 to 16

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/unlockedAvatarZoom) by nakoyasha
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
