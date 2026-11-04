# MessageLatency

Adds a small signal icon in front of the author's name on messages that took a while to arrive. It compares the time the sender's client created the message with the time Discord received it.

**Port type:** Full. Behaves like the original.

## Features

- Signal icon on messages delayed by at least the configured threshold, with the exact delay in its tooltip
- Icon colors: yellow for a delay, red for at least twice the threshold, gray for two minutes or more and for senders whose clock runs ahead, green for old Android clients
- Flags senders whose clock is ahead instead of reporting a negative delay
- Recognizes old Discord Android clients, which send a known bogus offset

## Installation

1. Download [MessageLatency.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/MessageLatency/MessageLatency.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Hover the signal icon next to a username to read the delay.

## Settings

Under **User Settings → BetterDiscord → Plugins → MessageLatency** (cog icon):

- **Threshold in seconds** (default 2): minimum delay that shows an icon
- **Detect old Discord Android clients** (on)
- **Show milliseconds** (off)
- **Ignore your own messages** (off)

## Notes

- Bot messages and messages without a nonce show no icon, because there is nothing to compare.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/messageLatency) by arHSM
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
