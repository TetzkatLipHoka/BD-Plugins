# GitHubRepos

Shows the public GitHub repositories of any Discord user who has linked a GitHub account.

**Port type:** Simplified. Opens as its own window instead of a tab in the user profile.

## Features

- **GitHub repositories** in the user context menu
- Search by name, description or language
- Sort by stars, name or last push
- Shows language, stars, last update and fork status. Click a repository to open it

## Installation

1. Download [GitHubRepos.plugin.js](https://raw.githubusercontent.com/TetzkatLipHoka/BD-Plugins/main/Plugins/GitHubRepos/GitHubRepos.plugin.js)
2. Put it into your BetterDiscord plugins folder:
   - **Windows:** `%APPDATA%\BetterDiscord\plugins\`
   - **macOS:** `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux:** `~/.config/BetterDiscord/plugins/`
3. Enable it under **User Settings → BetterDiscord → Plugins**

The plugin [updates itself](../../README.md#automatic-updates) from this repository.

## Usage

Right-click a user with a linked GitHub account → **GitHub repositories**

## Settings

Under **User Settings → BetterDiscord → Plugins → GitHubRepos** (cog icon):

- **Number of repos to load** (30): 10 to 100
- **Hide forks** (off)

## Notes

- The entry appears once Discord has loaded that user's profile, so open the profile first if it's missing.
- The plugin loads the most recently updated repositories up to your limit, and sorts and searches within those.
- Requests go directly from your client to api.github.com, without login. GitHub allows 60 requests per hour that way.

## Troubleshooting

Discord changes its internals all the time, so a client update can break this plugin. An error toast when it starts is usually the first sign. See [Reporting problems](../../README.md#reporting-problems).

## Credits & license

- Original plugin: [Equicord](https://github.com/Equicord/Equicord/tree/main/src/equicordplugins/githubRepos) by talhakf, Panniku, benjii
- Auto-updater: `UpdateManager` by [Pharaoh2k](https://github.com/Pharaoh2k), used with permission ([notice](../../THIRD_PARTY_NOTICES.md))
- License: [GPL-3.0-or-later](../../LICENSE), except the embedded updater

Version history: [CHANGELOG.md](CHANGELOG.md)

> Client modifications violate Discord's Terms of Service. Use at your own risk.
