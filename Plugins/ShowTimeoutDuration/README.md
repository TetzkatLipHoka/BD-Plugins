# ShowTimeoutDuration

Shows how much longer a user's timeout lasts, as a live countdown in the message header.

**Port type:** Full. Behaves like the original.

## Features

- Countdown right next to the timeout icon
- The remaining time is also added to the icon's tooltip

## Installation

1. Download [ShowTimeoutDuration.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ShowTimeoutDuration/ShowTimeoutDuration.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Nothing to do: the countdown appears wherever Discord shows the timeout icon on a message.

## Settings

Under **User Settings → BetterDiscord → Plugins → ShowTimeoutDuration** (cog icon):

- **Remaining time display** (Next to the timeout icon): or Tooltip only

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/showTimeoutDuration) by Ven, Sqaaakoi
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
