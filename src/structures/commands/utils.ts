import {
  BaseMessageOptions,
  Colors,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionsBitField,
  TextBasedChannel,
  User,
  VoiceBasedChannel,
} from "discord.js";
import { CommandContext } from "./Context";

// ============== BASIC INFO UTILITIES ==============
/**
 * Get the user from either message or interaction
 */
export function getUser(ctx: CommandContext): User {
  return ctx.interaction?.user || ctx.message?.author!;
}

/**
 * Get the user ID from either message or interaction
 */
export function getUserId(ctx: CommandContext): string {
  return ctx.interaction?.user.id || ctx.message?.author.id!;
}

/**
 * Get the guild from either message or interaction
 */
export function getGuild(ctx: CommandContext): Guild | null {
  return ctx.interaction?.guild || ctx.message?.guild || null;
}

/**
 * Get the guild ID from either message or interaction
 */
export function getGuildId(ctx: CommandContext): string | null {
  return ctx.interaction?.guildId || ctx.message?.guildId || null;
}

/**
 * Get the voice channel from either message or interaction
 */
export function getVoiceChannel(ctx: CommandContext): VoiceBasedChannel | null {
  return ctx.interaction?.channel as VoiceBasedChannel | null;
}

/**
 * Get the channel from either message or interaction
 */
export function getChannel(ctx: CommandContext): TextBasedChannel | null {
  return ctx.interaction?.channel || ctx.message?.channel || null;
}

/**
 * Get the channel ID from either message or interaction
 */
export function getChannelId(ctx: CommandContext): string | null {
  return ctx.interaction?.channelId || ctx.message?.channelId || null;
}

/**
 * Get the member from either message or interaction
 */
export function getMember(ctx: CommandContext): GuildMember | null {
  return (
    (ctx.interaction?.member as GuildMember) || ctx.message?.member || null
  );
}

// ============== REPLY UTILITIES ==============

/**
 * Reply to either slash command or prefix command
 */
export async function reply(
  ctx: CommandContext,
  options: BaseMessageOptions & { ephemeral?: boolean },
) {
  if (ctx.interaction) {
    if (ctx.interaction.replied || ctx.interaction.deferred) {
      return await ctx.interaction.editReply(options);
    }
    return await ctx.interaction.reply(options);
  } else if (ctx.message) {
    return await ctx.message.reply(options);
  }
  throw new Error("No valid context for reply");
}

/**
 * Defer reply for slash commands (no-op for prefix commands)
 */
export async function deferReply(
  ctx: CommandContext,
  ephemeral: boolean = false,
): Promise<void> {
  if (
    ctx.interaction &&
    !ctx.interaction.replied &&
    !ctx.interaction.deferred
  ) {
    await ctx.interaction.deferReply({ ephemeral });
  }
}

/**
 * Edit the reply (works for both if reply was already sent)
 */
export async function editReply(
  ctx: CommandContext,
  options: BaseMessageOptions & { ephemeral?: boolean },
) {
  if (ctx.interaction) {
    return await ctx.interaction.editReply(options);
  } else if (ctx.message && "send" in ctx.message.channel) {
    // For prefix commands, we'll need to track the reply message
    // This is a limitation - prefix commands can't easily edit replies
    return await ctx.message.channel.send(options);
  }
  throw new Error("No valid context for edit reply");
}

// ============== OPTION/ARGUMENT UTILITIES ==============

/**
 * Get string option/argument from either command type
 */
export function getStringOption(
  ctx: CommandContext,
  name: string,
  args?: string[],
  index?: number,
): string | null {
  if (ctx.interaction) {
    return ctx.interaction.options.getString(name);
  } else if (args && index !== undefined) {
    return args[index] ?? null;
  }
  return null;
}

/**
 * Get user option/argument from either command type
 */
export function getUserOption(
  ctx: CommandContext,
  name: string,
  args?: string[],
  index?: number,
): User | null {
  if (ctx.interaction) {
    return ctx.interaction.options.getUser(name);
  } else if (args && index !== undefined && ctx.message) {
    // Try to parse user mention or ID from prefix command
    const arg = args[index];
    if (!arg) return null;

    const match = arg.match(/^<@!?(\d+)>$/) || arg.match(/^(\d+)$/);
    if (match) {
      try {
        return ctx.client.users.cache.get(match[1]) || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Get integer option/argument from either command type
 */
export function getIntegerOption(
  ctx: CommandContext,
  name: string,
  args?: string[],
  index?: number,
): number | null {
  if (ctx.interaction) {
    return ctx.interaction.options.getInteger(name);
  } else if (args && index !== undefined) {
    const value = parseInt(args[index] || "");
    return isNaN(value) ? null : value;
  }
  return null;
}

/**
 * Get boolean option/argument from either command type
 */
export function getBooleanOption(
  ctx: CommandContext,
  name: string,
  args?: string[],
  index?: number,
): boolean | null {
  if (ctx.interaction) {
    return ctx.interaction.options.getBoolean(name);
  } else if (args && index !== undefined) {
    const arg = args[index]?.toLowerCase();
    if (arg === "true" || arg === "yes" || arg === "1") return true;
    if (arg === "false" || arg === "no" || arg === "0") return false;
    return null;
  }
  return null;
}

export function getChannelOption(
  ctx: CommandContext,
  name: string,
  args?: string[],
  index?: number,
): TextBasedChannel | null {
  if (ctx.interaction) {
    return ctx.interaction.options.getChannel(name) as TextBasedChannel | null;
  } else if (args && index !== undefined) {
    const arg = args[index];
    if (!arg) return null;
    return getGuild(ctx)?.channels.cache.get(arg) as TextBasedChannel | null;
  }
  return null;
}

// ============== ERROR HANDLING ==============

/**
 * Handle command errors consistently
 */
export async function handleCommandError(
  ctx: CommandContext,
  error: any,
  commandName: string,
): Promise<void> {
  console.log(`Error in ${commandName}:`, error);

  const errorEmbed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setDescription("An error occurred while executing this command.")
    .setTitle("Command Error");

  try {
    await reply(ctx, { embeds: [errorEmbed], ephemeral: true });
  } catch (replyError) {
    console.error("Failed to send error response:", replyError);
  }
}

/**
 * Check if the user is an admin (ManageGuild or Administrator)
 */
export function isAdmin(ctx: CommandContext): boolean {
  if (ctx.interaction) {
    const perms = ctx.interaction.member?.permissions as any;
    return Boolean(
      perms?.has?.("ManageGuild") ||
      perms?.has?.("Administrator") ||
      perms?.has?.(PermissionsBitField.Flags.Administrator) ||
      ctx.interaction.user.id === ctx.interaction.guild?.ownerId,
    );
  } else if (ctx.message) {
    return Boolean(
      ctx.message.member?.permissions.has("ManageGuild") ||
      ctx.message.member?.permissions.has("Administrator") ||
      ctx.message.member?.permissions.has(
        PermissionsBitField.Flags.Administrator,
      ) ||
      ctx.message.member?.id === ctx.message.guild?.ownerId,
    );
  }
  return false;
}
