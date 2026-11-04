# BetterBlockedUsers

Skips the "view profile anyway?" prompt for blocked users and adds a searchable list of everyone you have blocked.

**Port type:** Partial. Not ported: Merging consecutive "blocked message" rows.

## Features

- No prompt when opening a blocked user's profile
- Blocked-user list you can search by username, display name or exact ID
- **View profile** button for each entry

## Installation

1. Download [BetterBlockedUsers.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/BetterBlockedUsers/BetterBlockedUsers.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

1. Right-click the **settings cog** in the bottom-left user panel → **Search blocked users**
2. Or open the plugin settings, which contain the same list

## Settings

Under **User Settings → BetterDiscord → Plugins → BetterBlockedUsers** (cog icon):

- **Skip the prompt on blocked profiles** (on)
- The blocked-user list

## Notes

- Ignored users still show the prompt.
- Users Discord hasn't cached appear as "Unknown user" with their ID.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/betterBlockedUsers) by Equicord-Team
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
