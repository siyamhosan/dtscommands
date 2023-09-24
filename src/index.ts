import 'dotenv/config'
import Bot from './structures/library/Client.js'
import {
  Command,
  CommandOptions,
  CommandRun,
  CommandValidator,
  UniCommand,
  UniCommandRun,
  UniCommandValidator,
  SlashCommand,
  SlashCommandRun,
  SlashCommandValidator,
  Config,
  defaultConfig,
  Event,
  EventOptions
} from './structures/base/index.js'

import {
  CommandManager,
  Compiler,
  EventManager,
  SlashManager
} from './structures/helper/index.js'

export {
  Command,
  CommandOptions,
  CommandRun,
  CommandValidator,
  UniCommand,
  UniCommandRun,
  UniCommandValidator,
  SlashCommand,
  SlashCommandRun,
  SlashCommandValidator,
  Config,
  defaultConfig,
  Event,
  EventOptions,
  CommandManager,
  Compiler,
  EventManager,
  SlashManager,
  Bot
}
export default Bot
