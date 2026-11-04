# FullUserInChatbox

Turns @mentions inside the message box into real mentions, the same ones you see in sent messages.

**Port type:** Full. Behaves like the original.

## Features

- Left-click a mention in the message box to open the profile
- Right-click it for the user context menu
- Users Discord hasn't loaded keep the normal mention until they are known

## Installation

1. Download [FullUserInChatbox.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/FullUserInChatbox/FullUserInChatbox.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Type an @mention as usual, then click or right-click it before sending.

## Settings

This plugin has no settings of its own.

## Notes

- Takes effect after switching channels once. A toast reminds you when the plugin starts.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/fullUserInChatbox) by sadan
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
