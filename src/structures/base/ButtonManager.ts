import {
  ButtonInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  PermissionsBitField
} from 'discord.js'
import Bot from '../library/Client'
import { del9 } from '../utils/del'
import { CommandCooldownOptions, CooldownValidator } from './Cooldown'

export interface ButtonRun {
  interaction: ButtonInteraction
  client: Bot
  customId: string
}

export interface ButtonOptions {
  nickname?: string
  customIdValidation: (customId: string) => boolean
  description: string
  category: string
  validation?: string[]
  cooldown?: CommandCooldownOptions
}

export abstract class ButtonManager {
  readonly nickname: string
  readonly customIdValidation: (customId: string) => boolean
  readonly description: string
  readonly category: string
  readonly validation: string[]
  readonly cooldown: CommandCooldownOptions | undefined

  constructor (options: ButtonOptions) {
    this.nickname = options.nickname || ''
    this.customIdValidation = options.customIdValidation
    this.description = options.description
    this.category = options.category
    this.validation = options.validation || []
    this.cooldown = options.cooldown
  }

  abstract run(options: ButtonRun): void | Promise<void>
}
export async function ButtonValidation (
  interaction: ButtonInteraction,
  button: ButtonManager,
  client: Bot
) {
  // For DM channels, only basic checks are needed
  if (!interaction.guild) {
    if (button.validation.length > 0) {
      for (const validation of button.validation) {
        const customValidation = client.config.customValidations?.find(
          customValidation => customValidation.name === validation
        )
        if (!customValidation) {
          console.warn(`Custom validation ${validation} not found`)
          continue
        }

        if (
          !(await customValidation.validate({
            message: undefined,
            interaction
          }))
        ) {
          const messageOptions =
            typeof customValidation.onFail === 'function'
              ? await customValidation.onFail({ interaction })
              : customValidation.onFail

          if (typeof messageOptions === 'string') {
            await interaction.reply({
              content: messageOptions,
              ephemeral: true
            })
          } else if (messageOptions) {
            // Add null check here
            try {
              await interaction.reply({
                ...messageOptions,
                ephemeral: true
              })
            } catch (error) {}
          }
          return true
        }
      }
    }
    return false
  }

  const isBlockedByCooldown = await CooldownValidator(
    interaction,
    client,
    button
  )
  if (isBlockedByCooldown) return true

  // For guild channels
  const channel = interaction.channel as GuildTextBasedChannel

  if (
    !interaction.guild.members.me?.permissions.has(
      PermissionsBitField.resolve('SendMessages')
    )
  ) {
    await interaction.user
      .send({
        content: `I don't have **\`SEND_MESSAGES\`** permission in <#${interaction.channelId}> to execute this **\`${button.nickname}\`** button.`
      })
      .catch(() => null)
    return true
  }

  if (
    !interaction.guild.members.me.permissions.has(
      PermissionsBitField.resolve('ViewChannel')
    )
  ) {
    return true
  }

  if (
    !interaction.guild.members.me.permissions.has(
      PermissionsBitField.resolve('EmbedLinks')
    )
  ) {
    await channel
      .send({
        content: `I don't have **\`EMBED_LINKS\`** permission in <#${interaction.channelId}> to execute this **\`${button.nickname}\`** button.`
      })
      .catch(() => null)
    return true
  }

  const embed = new EmbedBuilder().setColor(client.config.themeColors.ERROR)

  if (button.validation.length > 0) {
    for (const validation of button.validation) {
      const customValidation = client.config.customValidations?.find(
        customValidation => customValidation.name === validation
      )
      if (!customValidation) continue

      if (
        !(await customValidation.validate({
          message: undefined,
          interaction
        }))
      ) {
        const messageOptions =
          typeof customValidation.onFail === 'function'
            ? await customValidation.onFail({ interaction })
            : customValidation.onFail

        if (typeof messageOptions === 'string') {
          embed.setDescription(messageOptions)
          await interaction.reply({ embeds: [embed], ephemeral: true })
        } else if (messageOptions instanceof EmbedBuilder) {
          if (messageOptions.toJSON().color === undefined) {
            messageOptions.setColor(client.config.themeColors.ERROR)
          }
          await interaction.reply({
            embeds: [messageOptions],
            ephemeral: true
          })
        } else if (messageOptions) {
          // Handle other message options
          try {
            await interaction.reply({
              ...messageOptions,
              ephemeral: true
            })
          } catch (error) {}
        }
        return true
      }
    }
  }

  return false
}
