import {
  BaseMessageOptions,
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  MessageReaction,
} from "discord.js";
import {
  deferReply,
  editReply,
  getBooleanOption,
  getChannel,
  getChannelId,
  getChannelOption,
  getGuild,
  getGuildId,
  getIntegerOption,
  getMember,
  getStringOption,
  getUser,
  getUserId,
  getUserOption,
  getVoiceChannel,
  handleCommandError,
  isAdmin,
  reply,
} from "./utils";

export interface CommandContext {
  message?: Message;
  interaction?: ChatInputCommandInteraction;
  client: any;
  args?: string[];
}

// ============== LOADING STATE INTERFACE ==============

interface LoadingState {
  type: "reaction" | "message";
  reaction?: MessageReaction;
  message?: Message;
  timeout?: NodeJS.Timeout; // Add timeout for automatic cleanup
}

export class CommandCTX {
  private ctx: CommandContext;
  private loadingState: LoadingState | null = null;
  private static readonly LOADING_TIMEOUT = 30000; // 30 seconds timeout

  constructor(ctx: CommandContext) {
    this.ctx = ctx;
  }

  get client() {
    return this.ctx.client;
  }

  get voiceChannel() {
    return getVoiceChannel(this.ctx);
  }

  // Basic Info Getters
  get user() {
    return getUser(this.ctx);
  }
  get userId() {
    return getUserId(this.ctx);
  }
  get guild() {
    return getGuild(this.ctx);
  }
  get guildId() {
    return getGuildId(this.ctx);
  }
  get channel() {
    return getChannel(this.ctx);
  }
  get channelId() {
    return getChannelId(this.ctx);
  }
  get member() {
    return getMember(this.ctx);
  }
  get isAdmin() {
    return isAdmin(this.ctx);
  }

  // Reply Methods
  async reply(
    options: BaseMessageOptions & { ephemeral?: boolean; flags?: MessageFlags },
  ) {
    await this.clearLoadingState();
    return await reply(this.ctx, options);
  }

  async deferReply(ephemeral: boolean = false) {
    if (this.ctx.interaction) {
      return await deferReply(this.ctx, ephemeral);
    } else if (this.ctx.message) {
      // For message commands, show loading indicator
      await this.showLoadingState();
    }
  }

  async editReply(options: BaseMessageOptions & { ephemeral?: boolean }) {
    await this.clearLoadingState();
    return await editReply(this.ctx, options);
  }

  async handleError(error: any, commandName: string) {
    await this.clearLoadingState(); // Ensure cleanup on error
    return await handleCommandError(this.ctx, error, commandName);
  }

  // Option/Argument Getters
  getStringOption(name: string, args?: string[], index?: number) {
    return getStringOption(this.ctx, name, args, index);
  }

  getUserOption(name: string, args?: string[], index?: number) {
    return getUserOption(this.ctx, name, args, index);
  }

  getIntegerOption(name: string, args?: string[], index?: number) {
    return getIntegerOption(this.ctx, name, args, index);
  }

  getBooleanOption(name: string, args?: string[], index?: number) {
    return getBooleanOption(this.ctx, name, args, index);
  }
  getChannelOption(name: string, args?: string[], index?: number) {
    return getChannelOption(this.ctx, name, args, index);
  }

  // Loading State Management Methods
  private async showLoadingState(): Promise<void> {
    if (!this.ctx.message || this.loadingState) return;

    // Set up automatic cleanup timeout to prevent memory leaks
    const timeout = setTimeout(() => {
      this.clearLoadingState().catch((err) =>
        console.warn("Failed to auto-clear loading state:", err),
      );
    }, CommandCTX.LOADING_TIMEOUT);

    try {
      // Try to react with a thinking emoji first
      const reaction = await this.ctx.message.react("🤔");
      this.loadingState = {
        type: "reaction",
        reaction: reaction,
        timeout: timeout,
      };
    } catch (error) {
      // If reaction fails, fallback to sending a temporary message
      try {
        const loadingMessage = await this.ctx.message.reply({
          content: "🤔 Processing...",
          allowedMentions: { repliedUser: false },
        });
        this.loadingState = {
          type: "message",
          message: loadingMessage,
          timeout: timeout,
        };
      } catch (fallbackError) {
        // Clear timeout if both methods fail
        clearTimeout(timeout);
        console.warn("Failed to show loading state:", fallbackError);
        // Continue without loading state if both methods fail
      }
    }
  }

  private async clearLoadingState(): Promise<void> {
    if (!this.loadingState) return;

    // Clear timeout to prevent memory leak
    if (this.loadingState.timeout) {
      clearTimeout(this.loadingState.timeout);
    }

    try {
      if (this.loadingState.type === "reaction" && this.loadingState.reaction) {
        await this.loadingState.reaction.users.remove(this.ctx.client.user.id);
      } else if (
        this.loadingState.type === "message" &&
        this.loadingState.message
      ) {
        await this.loadingState.message.delete();
      }
    } catch (error) {
      console.warn("Failed to clear loading state:", error);
      // Continue even if cleanup fails
    } finally {
      // Always clear references to prevent memory leaks
      this.loadingState = null;
    }
  }

  // Manual loading state control (if needed)
  async clearLoading(): Promise<void> {
    await this.clearLoadingState();
  }

  async showLoading(): Promise<void> {
    if (this.ctx.message && !this.loadingState) {
      await this.showLoadingState();
    }
  }

  // Cleanup method to be called when the context is no longer needed
  async cleanup(): Promise<void> {
    await this.clearLoadingState();
    // Clear any other references that might cause memory leaks
    this.ctx = null as any;
  }
}
