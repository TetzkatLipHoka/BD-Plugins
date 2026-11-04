# ToastNotifications

Shows new messages as in-app toast pop-ups, rendered with Discord's own message component.

**Port type:** Full. Behaves like the original.

## Features

- Toasts for DMs, group DMs and server channels, following your mute and notification settings
- Left-click jumps to the conversation, right-click marks it as read, X just closes
- Hovering a toast pauses its countdown
- Configurable position, display time, opacity and number of toasts
- Ignore list for users and an always-notify list for channels

## Installation

1. Download [ToastNotifications.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ToastNotifications/ToastNotifications.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Nothing to do: toasts appear for new messages outside the channel you have open. **Show example** in the settings previews one.

## Settings

Under **User Settings → BetterDiscord → Plugins → ToastNotifications** (cog icon):

- **Position** (Bottom left)
- **Display time (seconds)** (5): 1 to 15
- **Opacity (%)** (100): 10 to 100
- **Max. at once** (3): 1 to 5
- **Hide in Streamer Mode** (on)
- **Hide while on Do Not Disturb** (off)
- **Direct messages** (on)
- **Group DMs** (on)
- **Friends in servers** (on): notifies for friends' server messages, even if the channel wouldn't notify otherwise
- **Ignored user IDs**: comma-separated
- **Always notify for channel IDs**: comma-separated

## Notes

- **Friends in servers** and **Always notify for channel IDs** also apply to muted channels.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/toastNotifications) by Skully, Ethan, Buzzy
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
