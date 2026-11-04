# ImplicitRelationships

Lists people Discord thinks you interact with a lot but who aren't your friends, ranked by Discord's affinity score.

**Port type:** Simplified. Opens as its own window instead of an extra tab in the friends list.

## Features

- Ranked list, with 1 being the strongest affinity
- Search by username, display name or exact ID
- **Profile** and **DM** buttons for each person

## Installation

1. Download [ImplicitRelationships.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/ImplicitRelationships/ImplicitRelationships.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

1. Right-click the **settings cog** in the bottom-left user panel → **Implicit relationships**
2. Or open the plugin settings, which show the same list

## Settings

Under **User Settings → BetterDiscord → Plugins → ImplicitRelationships** (cog icon):

- No options. The settings panel shows the list itself.

## Notes

- People Discord hasn't cached appear as "Not cached" with their ID.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Vencord](https://github.com/Vendicated/Vencord/tree/main/src/plugins/implicitRelationships) by Dolfies
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
