# VoiceChatUtilities

Actions for everyone in a voice or stage channel at once, from the channel's context menu. Requests run one after the other with configurable pauses to avoid rate limits; the original fired them all at once.

**Port type:** Full. Behaves like the original.

## Features

- **Mention all**: inserts mentions of everyone in the channel into your message box
- **Disconnect all**, **Mute / Unmute all**, **Deafen / Undeafen all**
- **Move all to…** any other voice channel of the server, yourself included

## Installation

1. Download [VoiceChatUtilities.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/VoiceChatUtilities/VoiceChatUtilities.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

1. Right-click a voice or stage channel with people in it → **Voice Tools**
2. Choose an action. A toast appears when the run is finished

## Settings

Under **User Settings → BetterDiscord → Plugins → VoiceChatUtilities** (cog icon):

- **Actions before pausing** (5): 1 to 20
- **Pause (seconds)** (2): 1 to 10

## Notes

- You need the matching server permissions; Discord rejects the requests otherwise.
- Except for **Move all**, the actions skip you.
- The finishing toast counts all attempted actions. Failed requests are only logged to the console.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/voiceChatUtils) by D3SOX, nickwoah
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
