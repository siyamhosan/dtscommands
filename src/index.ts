import 'dotenv/config'

// base structures
import {
  Command,
  CommandOptions,
  CommandRun,
  CommandValidator
} from './structures/base/Command.js'
import {
  Config,
  CustomValidations,
  Manager,
  MentionMessage,
  TableConfig,
  ThemeColors,
  defaultConfig
} from './structures/base/Config.js'
import { Event, EventOptions } from './structures/base/Event.js'
import {
  SlashCommand,
  SlashCommandOptions,
  SlashCommandRun,
  SlashCommandValidator
} from './structures/base/SlashCommand.js'
import {
  UniCommandRun,
  UniCommandValidator
} from './structures/base/UniCommand.js'

// events

// helpers
import { CommandManager } from './structures/helper/commandManager.js'
import {
  Compiler,
  DynamicImport,
  compilerResult
} from './structures/helper/compiler.js'
import { EventManager } from './structures/helper/eventManager.js'
import { SlashManager } from './structures/helper/slashManager.js'

// library
import Bot from './structures/library/Client.js'
import Logger from './structures/library/Logger.js'

export {
  // base structures
  Command,
  CommandOptions,
  CommandRun,
  CommandValidator,
  Config,
  CustomValidations,
  Manager,
  MentionMessage,
  TableConfig,
  ThemeColors,
  defaultConfig,
  Event,
  EventOptions,
  SlashCommand,
  SlashCommandOptions,
  SlashCommandRun,
  SlashCommandValidator,
  UniCommandRun,
  UniCommandValidator,
  // events
  // helpers
  CommandManager,
  Compiler,
  DynamicImport,
  compilerResult,
  EventManager,
  SlashManager,
  // library
  Bot,
  Logger
}

export default Bot
