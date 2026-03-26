import chalk from "chalk";
import { GatewayIntentBits, Message, Partials } from "discord.js";
import { TableUserConfig } from "table";
import { CooldownConfigOptions, defaultCooldownMessage } from "./Cooldown";
import { PrefixManager } from "./prefixManager";

/**
 * Configuration for the bot's response when mentioned
 */
export type MentionMessage = {
  /** The text content of the mention response */
  content: string;
  /** Optional array of embeds to include in the response */
  embeds?: any[];
  /** Optional array of components (buttons, select menus, etc.) to include */
  components?: any[];
};

/**
 * Main configuration interface for the Discord bot
 */
export type Config = {
  /**
   * The bot's client ID
   * @default process.env.CLIENT_ID
   */
  clientId?: string;

  /** Array of user IDs who have owner permissions */
  owners?: string[];

  /** Array of user IDs who have beta tester permissions */
  beteTesters?: string[];

  /** Discord.js Gateway Intents to enable */
  intents?: GatewayIntentBits[];

  /** Discord.js Partials to enable */
  partials?: Partials[];

  /** The default command prefix */
  prefix: string | PrefixManager;

  /** Configuration for the bot's mention response */
  mentionMessage?:
    | MentionMessage
    | ((message: Message) => Promise<MentionMessage>);

  /** Cooldown configuration for commands */
  cooldown?: CooldownConfigOptions;

  /** Whether to enable guild only commands (GLOBAL DEFAULT: false) */
  guildOnly?: boolean;
};

/**
 * Default configuration values for the bot
 */
export const defaultConfig: Required<Config> = {
  clientId: process.env.CLIENT_ID ?? "",
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
    GatewayIntentBits.GuildIntegrations,
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.GuildMember,
    Partials.ThreadMember,
    Partials.Reaction,
    Partials.Channel,
  ],
  prefix: "!",
  mentionMessage: {
    content: "My prefix is `!`",
  },
  cooldown: {
    duration: 3000,
    type: "global",
    enabled: true,
    messageCreator: defaultCooldownMessage,
  },
  guildOnly: false,
  owners: [],
  beteTesters: [],
};

/**
 * Configuration for table formatting in console output
 */
export const TableConfig: TableUserConfig = {
  drawHorizontalLine: (lineIndex: number, rowCount: number) => {
    return lineIndex === 1 || lineIndex === 0 || lineIndex === rowCount;
  },

  border: {
    topBody: chalk.gray("─"),
    topJoin: chalk.gray("┬"),
    topLeft: chalk.gray("┌"),
    topRight: chalk.gray("┐"),

    bottomBody: chalk.gray("─"),
    bottomJoin: chalk.gray("┴"),
    bottomLeft: chalk.gray("└"),
    bottomRight: chalk.gray("┘"),

    bodyLeft: chalk.gray("│"),
    bodyRight: chalk.gray("│"),
    bodyJoin: chalk.gray("│"),

    joinBody: chalk.gray("─"),
    joinLeft: chalk.gray("├"),
    joinRight: chalk.gray("┤"),
    joinJoin: chalk.gray("┼"),
  },
};
