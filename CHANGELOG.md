# bkash-payment-api

## 0.10.2

### Patch Changes

- 83a0c55: Log Removed Bug Fixed?

## 0.10.1

### Patch Changes

- bc19f5d: Debugings Prefixes

## 0.10.0

### Minor Changes

- c484f0b: Prefix Manager, Dynamic Prefix System

## 0.9.1

### Patch Changes

- 4005f92: Export Of Helper fun

## 0.9.0

### Minor Changes

- 9c6bdf5: ### Added

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

## 0.8.0

### Minor Changes

- d51cd71: Validation Messages With Component Support

## 0.7.0

### Minor Changes

- d1cc719: Client options shard Issuq Fixed

## 0.6.0

### Minor Changes

- e46e388: Sharding Init | validation async able

## 0.5.4

### Patch Changes

- 83b6a96: Fixes on Mention Customizeable

## 0.5.3

### Patch Changes

- 394e5d0: Configure able Mention Message

## 0.5.2

### Patch Changes

- a4fb143: Bug fix

## 0.5.1

### Patch Changes

- 57939ec: Slashcommand validation Fixes

## 0.5.0

### Minor Changes

- 492ee6e: Added Cooldown system

### Patch Changes

- cf32c43: build check

## 0.4.6

### Patch Changes

- 92ec464: ButtonValidation Fixes

## 0.4.5

### Patch Changes

- fbfa4b8: Added Validation Error manager

## 0.4.4

### Patch Changes

- a161c00: bug fix

## 0.4.3

### Patch Changes

- bb4b4a0: FIX

## 0.4.2

### Patch Changes

- a55cade: Update
- 104c6ac: CustomIdValidation

## 0.4.1

### Patch Changes

- 9267243: ButtonsManager

## 0.4.0

### Minor Changes

- eedcecd: Button Manager

### Patch Changes

- 315248c: Update release

## 0.3.2

### Patch Changes

- 89aadfd: Added botAllow fun to commands

## 0.3.1

### Patch Changes

- f03a320: Added Custom Client Id system

## 0.3.0

### Minor Changes

- bb86eef: Slash Commands SubCOmmand Bug Fix Working Now

## 0.2.4

### Patch Changes

- 33c985e: sub command piority

## 0.2.3

### Patch Changes

- 5a2aab8: debug

## 0.2.2

### Patch Changes

- 4d0b35c: Bug Fix

## 0.2.1

### Patch Changes

- 433d0c8: Debuging slash command subs

## 0.2.0

### Minor Changes

- 6f68a18: Slash Command Type Fixed | Debug Removed

## 0.1.12

### Patch Changes

- 0eff620: Fixed Slash Command Manager

## 0.1.11

### Patch Changes

- 21f0658: 2

## 0.1.10

### Patch Changes

- 26a9417: Fighting with slash commands part 1

## 0.1.9

### Patch Changes

- 4716ebf: Validation Priority | Del Utils added

## 0.1.8

### Patch Changes

- 2cc8170: Imports Manages
- ac4efb0: Custom Validation Message Changeable

## 0.1.7

### Patch Changes

- 78b60f4: Compiler Bug Fix

## 0.1.6

### Patch Changes

- a9a7041: Additional/Multiple Prefix Support

## 0.1.5

### Patch Changes

- 477951b: Cooldown message format update with auto delete

## 0.1.4

### Patch Changes

- 39127a6: Cooldown Fixed

## 0.1.3

### Patch Changes

- 3972191: Added Custom Validation

## 0.1.2

### Patch Changes

- 390244a: Added Cooldown

## 0.1.1

### Patch Changes

- 3925763: bug

## 0.1.0

### Minor Changes

- 43a5991: Compiler Ignore Self Import

## 0.0.19

### Patch Changes

- 49adbf5: Intrection types
- 49adbf5: Permission type error fixed

## 0.0.18

### Patch Changes

- aba19f5: Added Client Services

## 0.0.17

### Patch Changes

- c74852b: Dynamic Import

## 0.0.16

### Patch Changes

- 4713262: Compiler file text fix

## 0.0.15

### Patch Changes

- 7dc5f35: clean up

## 0.0.14

### Patch Changes

- 52300f8: compiler test 2
- 6dc31b7: comiper test
- 30f8f84: versioning

## 0.0.12

### Patch Changes

- 40e6f7f: chalk esm problem version changed 5.0 -> 4.1.2

## 0.0.11

### Patch Changes

- 21a4a8a: packagename

## 0.0.10

### Patch Changes

- fe2d340: The DTS Beta

## 1.0.0

### Major Changes

- 7688abf: Sable version

### Patch Changes

- 9ca4d7c: Bug Fixed and Stable

## 0.9.2

### Patch Changes

- 3d026da: Imports And Exports

## 0.9.1

### Patch Changes

- dc28165: tested

## null

### Patch Changes

- 23b913e: v1

## 0.0.3

### Patch Changes

- 845a4c7: new sample package

## 0.0.2

### Patch Changes

- 3b5d3a8: added a sample function
- 8b596b8: Intial
