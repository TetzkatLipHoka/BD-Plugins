# Third-Party Notices

## UpdateManager, by Pharaoh2k

Every plugin in this repository embeds the `UpdateManager` class (the `//#region Updater … //#endregion Updater` block at the top of each file).

- **Author:** Pharaoh2k ([github.com/Pharaoh2k](https://github.com/Pharaoh2k))
- **Origin:** [Pharaoh2k/BetterDiscordStuff](https://github.com/Pharaoh2k/BetterDiscordStuff), taken from `Plugins/QuickMessages-Reborn/QuickMessages-Reborn.plugin.js`
- **Copyright:** © Pharaoh2k. All rights reserved by the author.
- **Permission:** The author gave written permission to copy and use the updater in this repository's plugins (Discord message, 2026-11-03: *"copy my updater so users get a notification if u update"*).
- **Changes:** The class is wrapped in a factory so it receives its own `BdApi` instance per plugin, `const UpdateManager = (({ Net, UI, Logger, Data, Plugins, Utils }) => class UpdateManager { … })(new BdApi("<PluginName>"))`. The class body is unchanged.

This class is **not** covered by this repository's GPL-3.0 license. It stays under Pharaoh2k's terms and is included with his permission. If you fork this repository and want to keep the updater, ask Pharaoh2k for permission yourself, or replace the updater.

## Vencord / Equicord

The plugin logic is ported from [Vencord](https://github.com/Vendicated/Vencord) and [Equicord](https://github.com/Equicord/Equicord), © Vendicated and contributors, licensed under GPL-3.0-or-later. The original authors of each plugin are named in the plugin's `@author` header.
