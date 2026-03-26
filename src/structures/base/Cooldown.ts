import {
  BaseMessageOptions,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  Interaction,
  Message,
  MessageCreateOptions,
} from "discord.js";
import { Command } from "../commands/Command";
import Bot from "../library/Client";

export type CooldownType = "global" | "specified";

export type CooldownMessageCreator = (
  timeLeft: number,
  ctx: Command,
) => BaseMessageOptions;

/**
 * Configuration options for command CooldownS
 * @interface CooldownConfigOptions
 *
 * @property {boolean} enabled - Whether the cooldown is enabled
 * @property {number} duration - Duration of the cooldown in milliseconds
 * @property {CooldownType} type - Type of cooldown (user, guild, channel, or global)
 *
 * @property {Function} cooldownCheck - Function to check if cooldown should be applied
 * When type is 'global', this can be used to specify or bypass CooldownS for specific cases
 * @param {Object} params - The parameters object
 * @param {Message} [params.message] - Discord message object
 * @param {Interaction} [params.interaction] - Discord interaction object
 * @returns {boolean} Whether the cooldown should be applied
 *
 * @property {Function} messageCreator - Function to create cooldown notification message
 * @param {number} timeLeft - Time remaining in cooldown
 * @param {Command|SlashCommand} ctx - Command context
 * @returns {MessageCreateOptions|string|EmbedBuilder} The message to send
 */
export interface CooldownConfigOptions {
  enabled: boolean;
  duration: number;
  type: CooldownType;
  cooldownCheck?: ({
    message,
    interaction,
  }: {
    message?: Message;
    interaction?: ChatInputCommandInteraction | ButtonInteraction;
  }) => boolean;
  messageCreator: CooldownMessageCreator;
}

export type CommandCooldownOptions = CooldownConfigOptions | boolean;

export class CooldownManager {
  private cooldowns: Collection<string, number>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60000; // Clean up every minute
  private readonly MAX_COOLDOWNS = 10000; // Maximum number of cooldowns to store

  constructor() {
    this.cooldowns = new Collection();
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Set up periodic cleanup to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.CLEANUP_INTERVAL);
  }

  generateKey(commandName: string, type: string, id: string): string {
    return `${commandName}-${type}-${id}`;
  }

  getRemainingTime(key: string): number | null {
    const cooldown = this.cooldowns.get(key);
    if (!cooldown) return null;

    const now = Date.now();
    const remaining = cooldown - now;

    // If expired, remove it immediately
    if (remaining <= 0) {
      this.cooldowns.delete(key);
      return null;
    }

    return remaining;
  }

  clearCooldown(key: string): void {
    this.cooldowns.delete(key);
  }

  setCooldown(key: string, duration: number): void {
    // Prevent memory overflow by limiting the number of stored cooldowns
    if (this.cooldowns.size >= this.MAX_COOLDOWNS) {
      this.cleanupExpired();

      // If still at max capacity after cleanup, remove oldest entries
      if (this.cooldowns.size >= this.MAX_COOLDOWNS) {
        const entries = Array.from(this.cooldowns.entries());
        entries.sort((a, b) => a[1] - b[1]); // Sort by expiry time

        // Remove the oldest 10% of entries
        const toRemove = Math.floor(this.MAX_COOLDOWNS * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
          this.cooldowns.delete(entries[i]?.[0] ?? "");
        }
      }
    }

    const now = Date.now();
    this.cooldowns.set(key, now + duration);
  }

  cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Collect expired keys first to avoid modifying collection during iteration
    this.cooldowns.forEach((expiry, key) => {
      if (expiry <= now) {
        keysToDelete.push(key);
      }
    });

    // Delete expired entries
    keysToDelete.forEach((key) => {
      this.cooldowns.delete(key);
    });
  }

  // Method to properly destroy the manager and prevent memory leaks
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cooldowns.clear();
  }

  // Get current stats for monitoring
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cooldowns.size,
      maxSize: this.MAX_COOLDOWNS,
    };
  }
}

export const defaultCooldownMessage = (
  timeLeft: number,
  ctx: Command,
): MessageCreateOptions => {
  const commandName = ctx.options.name;

  const embed = new EmbedBuilder()
    .setTitle("Cooldown")
    .setDescription(
      `You are on cooldown for the action \`${commandName}\`. Please wait ${Math.ceil(timeLeft / 1000)}s before using it again.`,
    )
    .setColor("Red");

  return { embeds: [embed] };
};

export async function CooldownValidator(
  interaction: ButtonInteraction | Message | ChatInputCommandInteraction,
  client: Bot,
  ctx: Command,
): Promise<boolean> {
  let isCooldownEnabled = false;
  let duration = 3000;
  let messageOption: CooldownMessageCreator = defaultCooldownMessage;
  const commandName = ctx.options.name ?? "Unknown";

  const cooldown = ctx.options.commandCooldown;

  if (client.config.cooldown.enabled) {
    isCooldownEnabled = true;
    messageOption = client.config.cooldown.messageCreator;
    duration = client.config.cooldown.duration;

    if (client.config.cooldown.type === "global") {
      if (typeof cooldown === "boolean") {
        isCooldownEnabled = cooldown;
      } else if (
        typeof cooldown === "object" &&
        "enabled" in cooldown &&
        "messageCreator" in cooldown &&
        "duration" in cooldown
      ) {
        isCooldownEnabled = cooldown.enabled;
        messageOption = cooldown.messageCreator;
        duration = cooldown.duration;
      }
    } else if (client.config.cooldown.type === "specified") {
      if (cooldown) {
        if (typeof cooldown === "boolean") {
          isCooldownEnabled = cooldown;
        } else if (
          typeof cooldown === "object" &&
          "enabled" in cooldown &&
          "messageCreator" in cooldown &&
          "duration" in cooldown
        ) {
          isCooldownEnabled = cooldown.enabled;
          messageOption = cooldown.messageCreator;
          duration = cooldown.duration;
        }
      }
    }
  }

  if (isCooldownEnabled) {
    if (client.config.cooldown.cooldownCheck) {
      const extraCheck = client.config.cooldown.cooldownCheck({
        message: interaction instanceof Message ? interaction : undefined,
        interaction:
          interaction instanceof ButtonInteraction ||
          interaction instanceof ChatInputCommandInteraction
            ? interaction
            : undefined,
      });

      isCooldownEnabled = extraCheck && isCooldownEnabled;
    }

    const key = client.cooldownManager.generateKey(
      commandName,
      "user",
      interaction instanceof Message
        ? interaction.author.id
        : interaction.user.id,
    );

    const remainingTime = client.cooldownManager.getRemainingTime(key);

    if (remainingTime) {
      // User is on cooldown, send message
      const message = messageOption(remainingTime, ctx);

      try {
        if (interaction instanceof Message) {
          const msg = await interaction.reply(message);

          // Use a more reasonable timeout and add error handling
          const deleteTimeout = Math.min(remainingTime, 30000); // Max 30 seconds
          const timeoutId = setTimeout(async () => {
            try {
              if (msg.deletable) {
                await msg.delete();
              }
            } catch (error) {
              // Silently handle deletion errors (message might already be deleted)
            }
          }, deleteTimeout);

          // Clear timeout if process is shutting down to prevent memory leaks
          process.once("SIGTERM", () => clearTimeout(timeoutId));
          process.once("SIGINT", () => clearTimeout(timeoutId));
        } else {
          await interaction.reply({ ...message, ephemeral: true });

          // For interactions, we don't need to delete the reply as ephemeral messages auto-delete
          // and deleteReply() can cause issues if the interaction is already handled
        }
      } catch (error) {
        console.error("Failed to send cooldown message:", error);
      }

      return true;
    } else {
      // No cooldown active, set new cooldown
      client.cooldownManager.setCooldown(key, duration);
      return false;
    }
  }

  return false;
}
