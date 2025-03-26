/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  PermissionResolvable,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js'
import Bot from '../library/Client.js'
import { CommandCooldownOptions, CooldownValidator } from './Cooldown.js'

export interface SlashCommandRun {
  interaction: ChatInputCommandInteraction
  options: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
  client: Bot
}

export interface SlashCommandOptions {
  data?: SlashCommandBuilder | undefined
  category?: string
  subCommand?: string | undefined
  manager?: boolean
  botPerms?: PermissionResolvable[]
  beta?: boolean
  validation?: string[]
  cooldown?: CommandCooldownOptions
}

export abstract class SlashCommand {
  readonly data: SlashCommandBuilder | undefined
  readonly category: string | undefined
  readonly subCommand: string | undefined
  readonly manager: boolean
  readonly botPerms: PermissionResolvable[]
  readonly beta: boolean
  readonly validation: string[]
  readonly cooldown: CommandCooldownOptions | undefined

  constructor (options: SlashCommandOptions) {
    this.data = options.data || undefined
    this.subCommand = options.subCommand || undefined
    this.category = options.category || undefined
    this.manager = options.manager || false
    this.botPerms = options.botPerms || []
    this.beta = options.beta || false
    this.validation = options.validation || []
    this.cooldown = options.cooldown || undefined
  }

  public abstract run?(options: SlashCommandRun): void
}

export async function SlashCommandValidator (
  interaction: ChatInputCommandInteraction,
  cmd: SlashCommand,
  client: Bot
): Promise<boolean> {
  const embed = new EmbedBuilder().setColor(Colors.Red)
  if (cmd.botPerms) {
    if (
      !interaction.guild?.members.me?.permissions.has(
        PermissionsBitField.resolve(cmd.botPerms || [])
      )
    ) {
      embed
        .setDescription(
          `I don't have **\`${cmd.botPerms
            .map(perm => perm)
            .join(
              ', '
            )}\`** permission in ${interaction.channel?.toString()} to execute this **\`${
            cmd.data?.name || cmd.subCommand
          }\`** command.`
        )
        .setTitle('Missing Permissions')
      const fixPermissionsButton = new ButtonBuilder()
        .setLabel('Fix Permissions')
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&scope=bot%20applications.commands&permissions=382185367609&guild_id=${interaction.guild?.id}&disable_guild_select=true`
        )
      if (interaction.replied) {
        interaction.editReply({
          embeds: [embed],
          components: [
            // @ts-ignore
            new ActionRowBuilder().addComponents(fixPermissionsButton)
          ]
        })
        return true
      } else {
        interaction.reply({
          embeds: [embed],
          components: [
            // @ts-ignore
            new ActionRowBuilder().addComponents(fixPermissionsButton)
          ]
        })
        return true
      }
    }
  }

  const isBlockedByCooldown = await CooldownValidator(interaction, client, cmd)
  if (isBlockedByCooldown) return true

  if (cmd.beta) {
    if (
      !client.config.beteTesters?.includes(interaction.user.id) &&
      !client.config.owners?.includes(interaction.user.id)
    ) {
      embed.setDescription(`This command is in beta testing.`)
      if (interaction.replied) {
        interaction.editReply({
          embeds: [embed]
        })
        return true
      } else {
        interaction.reply({
          embeds: [embed]
        })
        return true
      }
    }
  }

  if (cmd.validation.length > 0) {
    for (const validation of cmd.validation) {
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
        if (typeof customValidation.onFail === 'string') {
          embed.setDescription(customValidation.onFail)
          if (interaction.replied) {
            interaction.editReply({
              embeds: [embed]
            })
          } else {
            interaction.reply({
              embeds: [embed]
            })
          }
        } else if (customValidation.onFail instanceof EmbedBuilder) {
          if (customValidation.onFail.toJSON().color === undefined)
            customValidation.onFail.setColor(client.config.themeColors.ERROR)

          if (interaction.replied) {
            interaction.editReply({
              embeds: [customValidation.onFail]
            })
          } else {
            interaction.reply({
              embeds: [customValidation.onFail]
            })
          }
        }

        return true
      }
    }
  }

  return false
}
