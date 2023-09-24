import { GatewayIntentBits, Partials } from 'discord.js'
import path from 'path'

export type Manager = {
  guildId: string
  roleId: string
}

export type ThemeColors = {
  SUCCESS: number
  ERROR: number
  WARNING: number
  PRIMARY: number
  SECONDARY: number
}

export type MentionMessage = {
  content: string
  embeds?: any[]
  components?: any[]
}

export type Config = {
  /**
   * The token of the bot (default: process.env.TOKEN)
   */
  token?: string
  /**
   *  Will monitor the files and reload them on change (default: false)
   */
  monitor?: boolean
  intents?: GatewayIntentBits[]
  partials?: Partials[]
  owners?: string[]
  testServers?: string[]
  beteTesters?: string[]
  managers?: Manager[]
  themeColors?: ThemeColors
  prefix: string
  commandsDir: string
  eventsDir: string
  uniCommandsDir: string
  slashCommandsDir: string
  mentionMessage?: MentionMessage
}

export const defaultConfig: Required<Config> = {
  token: process.env.TOKEN ?? '',
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
  }
}
