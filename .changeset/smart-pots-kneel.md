---
"dtscommands": minor
---

### Added
- **Dynamic Command Management**: Commands, slash commands, universal commands, and button handlers can now be added, removed, and updated at runtime without requiring a bot restart
  - `addCommand()` / `removeCommand()` - Manage regular commands dynamically
  - `addSlashCommand()` / `removeSlashCommand()` - Manage slash commands with automatic Discord API registration
  - `addUniCommand()` / `removeUniCommand()` - Manage universal commands dynamically
  - `addButton()` / `removeButton()` - Manage button handlers dynamically
  - `updateCommands()`, `updateSlashCommands()`, `updateUniCommands()`, `updateButtons()` - Bulk update operations
  - `getCommandStats()` - Get statistics about currently loaded commands
  - Comprehensive debug logging for troubleshooting
  - Automatic alias management when adding/removing commands
  - Proper Discord API integration for slash command registration

### Changed
- Event handlers now always use the latest collection references, ensuring dynamic updates take effect immediately
- Button event handler improved to use more efficient lookup method

### Technical Details
- Zero-downtime command updates for production bots
- Memory-safe command replacement (old instances are properly cleaned up)
- Rate-limit aware Discord API integration for slash commands
- Full TypeScript support with proper JSDoc documentation
