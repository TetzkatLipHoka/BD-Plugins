# NoNitroUpsell

Hides Nitro upsells by making the client believe locally that you have Nitro.

**Port type:** Full. Behaves like the original.

## Features

- Sets the client's local premium-type override, and resets it when you disable the plugin

## Installation

1. Download [NoNitroUpsell.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/NoNitroUpsell/NoNitroUpsell.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Nothing to do: enable the plugin.

## Settings

This plugin has no settings of its own.

## Notes

- May interfere with YABDP4Nitro, so use one or the other.
- Your account gains no Nitro perks. This only changes what the client shows.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/noNitroUpsell) by thororen
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
