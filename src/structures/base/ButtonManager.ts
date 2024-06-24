import {
  ButtonInteraction,
  EmbedBuilder,
  PermissionsBitField
} from 'discord.js'
import Bot from '../library/Client'
import { del9 } from '../utils/del'

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
}

export abstract class ButtonManager {
  readonly nickname: string
  readonly customIdValidation: (customId: string) => boolean
  readonly description: string
  readonly category: string
  readonly validation: string[]

  constructor (options: ButtonOptions) {
    this.nickname = options.nickname || ''
    this.customIdValidation = options.customIdValidation
    this.description = options.description
    this.category = options.category
    this.validation = options.validation || []
  }

  abstract run(options: ButtonRun): void | Promise<void>
}

export async function ButtonValidation (
  interaction: ButtonInteraction,
  button: ButtonManager,
  client: Bot
) {
  if (
    !interaction.guild?.members.me?.permissions.has(
      PermissionsBitField.resolve('SendMessages')
    )
  ) {
    await interaction.user.dmChannel
      ?.send({
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
    await interaction.channel
      ?.send({
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
        !customValidation.validate({
          message: undefined,
          interaction
        })
      ) {
        if (typeof customValidation.onFail === 'string') {
          embed.setDescription(customValidation.onFail)
          interaction.channel?.send({ embeds: [embed] })
        } else if (customValidation.onFail instanceof EmbedBuilder) {
          if (customValidation.onFail.toJSON().color === undefined)
            customValidation.onFail.setColor(client.config.themeColors.ERROR)

          interaction.channel
            ?.send({ embeds: [customValidation.onFail] })
            .then(del9)
            .catch(() => null)
        }

        return true
      }
    }
  }

  return false
}
