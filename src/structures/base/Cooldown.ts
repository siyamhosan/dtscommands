import {
  BaseMessageOptions,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  EmbedBuilder,
  Interaction,
  Message,
  MessageCreateOptions
} from 'discord.js'
import Bot from '../library/Client'
import { ButtonManager } from './ButtonManager'
import { Command } from './Command'
import { SlashCommand } from './SlashCommand'

export type CooldownType = 'global' | 'specified'

export type CooldownMessageCreator = (
  timeLeft: number,
  ctx: Command | SlashCommand | ButtonManager
) => BaseMessageOptions

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
  enabled: boolean
  duration: number
  type: CooldownType
  cooldownCheck?: ({
    message,
    interaction
  }: {
    message?: Message
    interaction?: ChatInputCommandInteraction | ButtonInteraction
  }) => boolean
  messageCreator: CooldownMessageCreator
}

export type CommandCooldownOptions = CooldownConfigOptions | boolean

export class CooldownManager {
  private cooldowns: Collection<string, number>

  constructor () {
    this.cooldowns = new Collection()
  }

  generateKey (commandName: string, type: string, id: string): string {
    this.cleanupExpired()
    return `${commandName}-${type}-${id}`
  }

  getRemainingTime (key: string): number | null {
    const cooldown = this.cooldowns.get(key) || 0
    const now = Date.now()
    this.cleanupExpired()
    return cooldown > now ? cooldown - now : null
  }

  clearCooldown (key: string): void {
    this.cooldowns.delete(key)
  }

  setCooldown (key: string, duration: number): void {
    const now = Date.now()
    this.cooldowns.set(key, now + duration)
    this.cleanupExpired()
  }

  cleanupExpired (): void {
    const now = Date.now()
    this.cooldowns.forEach((expiry, key) => {
      if (expiry <= now) {
        this.cooldowns.delete(key)
      }
    })
  }
}

export const defaultCooldownMessage = (
  timeLeft: number,
  ctx: Command | SlashCommand | ButtonManager
): MessageCreateOptions => {
  const commandName =
    ctx instanceof Command
      ? ctx.name
      : ctx instanceof SlashCommand
      ? ctx.data?.name ?? ctx.subCommand
      : ctx instanceof ButtonManager
      ? ctx.nickname
      : 'Unknown'

  const embed = new EmbedBuilder()
    .setTitle('Cooldown')
    .setDescription(
      `You are on cooldown for the action \`${commandName}\`. Please wait ${timeLeft}ms before using it again.`
    )
    .setColor('Red')

  return { embeds: [embed] }
}

export async function CooldownValidator (
  interaction: ButtonInteraction | Message | ChatInputCommandInteraction,
  client: Bot,
  ctx: Command | SlashCommand | ButtonManager
): Promise<boolean> {
  let isCooldownEnabled = false
  let duration = 3000
  let messageOption: CooldownMessageCreator = defaultCooldownMessage
  const commandName =
    (ctx instanceof Command
      ? ctx.name
      : ctx instanceof SlashCommand
      ? ctx.data?.name ?? ctx.subCommand
      : ctx.nickname) ?? 'Unknown'

  const cooldown = ctx.cooldown

  if (client.config.cooldown.enabled) {
    isCooldownEnabled = true
    messageOption = client.config.cooldown.messageCreator
    duration = client.config.cooldown.duration

    if (client.config.cooldown.type === 'global') {
      if (typeof cooldown === 'boolean') {
        isCooldownEnabled = cooldown
      } else if (
        typeof cooldown === 'object' &&
        'enabled' in cooldown &&
        'messageCreator' in cooldown &&
        'duration' in cooldown
      ) {
        isCooldownEnabled = cooldown.enabled
        messageOption = cooldown.messageCreator
        duration = cooldown.duration
      }
    } else if (client.config.cooldown.type === 'specified') {
      if (cooldown) {
        if (typeof cooldown === 'boolean') {
          isCooldownEnabled = cooldown
        } else if (
          typeof cooldown === 'object' &&
          'enabled' in cooldown &&
          'messageCreator' in cooldown &&
          'duration' in cooldown
        ) {
          isCooldownEnabled = cooldown.enabled
          messageOption = cooldown.messageCreator
          duration = cooldown.duration
        }
      }
    }
  }

  if (isCooldownEnabled) {
    if (client.config.cooldown.cooldownCheck) {
      const extraCheck = client.config.cooldown.cooldownCheck({
        message: interaction instanceof Message ? interaction : undefined,
        interaction:
          interaction instanceof ButtonInteraction ? interaction : undefined
      })

      isCooldownEnabled = extraCheck && isCooldownEnabled
    }

    const key = client.cooldownManager.generateKey(
      commandName,
      'user',
      interaction instanceof Message
        ? interaction.author.id
        : interaction.user.id
    )
    const remainingTime = client.cooldownManager.getRemainingTime(key)
    if (!remainingTime) {
      client.cooldownManager.setCooldown(key, duration)
    }

    if (remainingTime) {
      const message = messageOption(remainingTime, ctx)
      if (interaction instanceof Message) {
        const msg = await interaction.reply(message)
        setTimeout(async () => {
          try {
            await msg.delete()
          } catch (error) {
            console.error('Failed to delete cooldown message:', error)
          }
        }, remainingTime)
      } else {
        await interaction.reply({ ...message, fetchReply: true })
        setTimeout(async () => {
          try {
            await interaction.deleteReply()
          } catch (error) {
            console.error('Failed to delete cooldown message:', error)
          }
        }, remainingTime)
      }

      return true
    }

    return false
  }

  return false
}
