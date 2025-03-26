import chalk from 'chalk'
import {
  ActivityType,
  APIEmbed,
  GatewayIntentBits,
  Interaction,
  JSONEncodable,
  Message,
  Partials,
  PresenceData
} from 'discord.js'
import path from 'path'
import { TableUserConfig } from 'table'
import { CooldownConfigOptions, defaultCooldownMessage } from './Cooldown'

/**
 * Represents a manager role configuration for a specific guild
 */
export type Manager = {
  /** The ID of the guild where this manager role applies */
  guildId: string
  /** The ID of the role that has manager permissions */
  roleId: string
}

/**
 * Defines the color scheme used throughout the bot
 */
export type ThemeColors = {
  /** Color used for success messages (default: 0x00ff00) */
  SUCCESS: number
  /** Color used for error messages (default: 0xff0000) */
  ERROR: number
  /** Color used for warning messages (default: 0xffff00) */
  WARNING: number
  /** Primary color used for general messages (default: 0x0000ff) */
  PRIMARY: number
  /** Secondary color used for alternative messages (default: 0x00ffff) */
  SECONDARY: number
}

/**
 * Configuration for the bot's response when mentioned
 */
export type MentionMessage = {
  /** The text content of the mention response */
  content: string
  /** Optional array of embeds to include in the response */
  embeds?: any[]
  /** Optional array of components (buttons, select menus, etc.) to include */
  components?: any[]
}

/**
 * Custom validation rules for commands
 */
export type CustomValidations = {
  /**
   * Function that validates if a command can be executed
   * @param message - The message that triggered the command
   * @param interaction - The interaction that triggered the command
   * @returns boolean or Promise<boolean> indicating if validation passed
   */
  validate: ({
    message,
    interaction
  }: {
    message?: Message
    interaction?: Interaction
  }) => boolean | Promise<boolean>
  /** Message or embed to show when validation fails */
  onFail: string | (JSONEncodable<APIEmbed> | APIEmbed)
  /** Name of the validation rule */
  name: string
}

/**
 * Main configuration interface for the Discord bot
 */
export type Config = {
  /**
   * The bot's authentication token
   * @default process.env.TOKEN
   */
  token?: string

  /**
   * The bot's client ID
   * @default process.env.CLIENT_ID
   */
  clientId?: string

  /**
   * Whether to enable file monitoring for hot reloading
   * @default false
   */
  monitor?: boolean

  /** Discord.js Gateway Intents to enable */
  intents?: GatewayIntentBits[]

  /** Discord.js Partials to enable */
  partials?: Partials[]

  /** Array of user IDs who have owner permissions */
  owners?: string[]

  /** Array of server IDs for testing */
  testServers?: string[]

  /** Array of user IDs for beta testing */
  beteTesters?: string[]

  /** Array of manager role configurations */
  managers?: Manager[]

  /** Custom color scheme for the bot */
  themeColors?: ThemeColors

  /** The default command prefix */
  prefix: string

  /** Additional command prefixes */
  additionalPrefixes?: string[]

  /** Directory containing command files */
  commandsDir: string

  /** Directory containing event files */
  eventsDir: string

  /** Directory containing universal command files */
  uniCommandsDir: string

  /** Directory containing slash command files */
  slashCommandsDir: string

  /** Configuration for the bot's mention response */
  mentionMessage?:
    | MentionMessage
    | ((message: Message) => Promise<MentionMessage>)

  /** Cooldown configuration for commands */
  cooldown?: CooldownConfigOptions

  /** Array of custom validation rules */
  customValidations?: CustomValidations[]

  /** Whether to enable sharding */
  isSharding?: boolean

  /** Shard configuration */
  shards?: number | readonly number[] | 'auto'

  /** Total number of shards */
  shardCount?: number

  /** Bot presence configuration */
  presence?: PresenceData
}

/**
 * Default configuration values for the bot
 */
export const defaultConfig: Required<Config> = {
  token: process.env.TOKEN ?? '',
  clientId: process.env.CLIENT_ID ?? '',
  monitor: false,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.GuildMember,
    Partials.ThreadMember,
    Partials.Reaction,
    Partials.Channel
  ],
  owners: [],
  testServers: [],
  beteTesters: [],
  managers: [],
  prefix: '!',
  additionalPrefixes: [],
  themeColors: {
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    WARNING: 0xffff00,
    PRIMARY: 0x0000ff,
    SECONDARY: 0x00ffff
  },
  commandsDir: path.join(__dirname, 'src/main/commands'),
  eventsDir: path.join(__dirname, 'src/main/events'),
  uniCommandsDir: path.join(__dirname, 'src/main/commands/uniCommands'),
  slashCommandsDir: path.join(__dirname, 'src/main/commands/slashCommands'),
  mentionMessage: {
    content: 'My prefix is `!`'
  },
  cooldown: {
    duration: 3000,
    type: 'global',
    enabled: true,
    messageCreator: defaultCooldownMessage
  },
  customValidations: [],
  isSharding: false,
  shards: 'auto',
  shardCount: 1,
  presence: {
    status: 'online',
    activities: [{ name: 'with dtscommands', type: ActivityType.Playing }]
  }
}

/**
 * Configuration for table formatting in console output
 */
export const TableConfig: TableUserConfig = {
  drawHorizontalLine: (lineIndex: number, rowCount: number) => {
    return lineIndex === 1 || lineIndex === 0 || lineIndex === rowCount
  },

  border: {
    topBody: chalk.gray('─'),
    topJoin: chalk.gray('┬'),
    topLeft: chalk.gray('┌'),
    topRight: chalk.gray('┐'),

    bottomBody: chalk.gray('─'),
    bottomJoin: chalk.gray('┴'),
    bottomLeft: chalk.gray('└'),
    bottomRight: chalk.gray('┘'),

    bodyLeft: chalk.gray('│'),
    bodyRight: chalk.gray('│'),
    bodyJoin: chalk.gray('│'),

    joinBody: chalk.gray('─'),
    joinLeft: chalk.gray('├'),
    joinRight: chalk.gray('┤'),
    joinJoin: chalk.gray('┼')
  }
}
