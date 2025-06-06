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
import {
  ButtonManager,
  ButtonOptions,
  ButtonRun,
  ButtonValidation
} from './structures/base/ButtonManager.js'
import {
  CommandCooldownOptions,
  CooldownConfigOptions,
  CooldownManager,
  CooldownMessageCreator,
  CooldownType,
  CooldownValidator,
  defaultCooldownMessage
} from './structures/base/Cooldown.js'
import { PrefixManager } from './structures/base/prefixManager.js'
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
import { ButtonsManager } from './structures/helper/buttonManager.js'

// library
import Bot from './structures/library/Client.js'
import Logger from './structures/library/Logger.js'
import { ValidationError } from './structures/library/Error.js'

// utils
import {
  del3,
  del5,
  del9,
  del25,
  del30,
  del60,
  del80
} from './structures/utils/del.js'
import {
  botCommandEventsManager,
  CommandsEvent,
  InteractionCommandEvent,
  ButtonEvent
} from './structures/events/index.js'

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
  ButtonManager,
  ButtonOptions,
  ButtonRun,
  ButtonValidation,
  CommandCooldownOptions,
  CooldownConfigOptions,
  CooldownManager,
  CooldownMessageCreator,
  CooldownType,
  CooldownValidator,
  defaultCooldownMessage,
  botCommandEventsManager,
  CommandsEvent,
  InteractionCommandEvent,
  ButtonEvent,
  PrefixManager,
  // events
  // helpers
  CommandManager,
  Compiler,
  DynamicImport,
  compilerResult,
  EventManager,
  SlashManager,
  ButtonsManager,
  // library
  Bot,
  Logger,
  ValidationError,
  // utils
  del3,
  del5,
  del9,
  del25,
  del30,
  del60,
  del80
}

export default Bot
