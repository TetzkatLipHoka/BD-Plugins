# BiggerStreamPreview

Opens a stream's preview image in a large modal, so you can see what someone is streaming without joining.

**Port type:** Full. Behaves like the original.

## Features

- **View stream preview** in the user and stream context menus

## Installation

1. Download [BiggerStreamPreview.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BiggerStreamPreview/BiggerStreamPreview.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Right-click a user who is streaming, or a stream → **View stream preview**

## Settings

This plugin has no settings of its own.

## Notes

- The entry only appears while the user is streaming.
- This is Discord's preview snapshot, not live video. Without one you get a "No preview available" toast.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/biggerStreamPreview) by phil
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
