# PauseInvitesForever

Discord only offers timed pauses in its "Pause invites" dialog now. This plugin brings back the option to pause invites with no end date.

**Port type:** Full. Behaves like the original.

## Features

- A **Pause indefinitely** button in the dialog

## Installation

1. Download [PauseInvitesForever.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/PauseInvitesForever/PauseInvitesForever.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Open Discord's "Pause invites" dialog for your server and click **Pause indefinitely**.

## Settings

This plugin has no settings of its own.

## Notes

- The button only appears if you have the permission for it and invites aren't disabled already.
- Invites stay paused until you enable them again.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/pauseInvitesForever) by Dolfies, amia
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
