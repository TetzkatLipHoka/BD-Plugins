# JumpTo

Adds context-menu entries that jump straight to the first or last message of a conversation, or of one user in a channel.

**Port type:** Full. Behaves like the original.

## Features

- **Jump to first / last message** on channels, threads and group DMs, and on users in a DM
- **Jump to this user's first / last message** on messages in servers
- In a forum, the entries apply to the post you have open

## Installation

1. Download [JumpTo.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/JumpTo/JumpTo.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Right-click a channel, thread, group DM, DM user or message and choose a jump entry.

## Settings

This plugin has no settings of its own.

## Notes

- The per-user jumps use Discord's search, so they only exist in servers and only find what search can find.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/jumpTo) by Samwich, thororen
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
