import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildTextBasedChannel,
  Message,
  PermissionsBitField,
  SlashCommandBuilder,
  User
} from 'discord.js'
import Bot from '../library/Client.js'
import { CommandOptions } from './Command.js'

export interface UniCommandRun {
  ctx: ChatInputCommandInteraction | Message<true>
  args: string[]
  client: Bot
  prefix: string
}

/**
 * "UniCommand" is a command that can be used in both slash commands and normal commands.
 * @deprecated
 */
export abstract class UniCommand {
  readonly command: CommandOptions
  readonly slash: SlashCommandBuilder

  constructor (command: CommandOptions, slash?: SlashCommandBuilder) {
    this.command = command
    if (slash) {
      slash?.setName(command.name).setDescription(command.description)
      this.slash = slash
    } else {
      this.slash = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description)
    }
  }

  public abstract run(options: UniCommandRun): void
}

export async function UniCommandValidator (
  ctx: Message<true> | ChatInputCommandInteraction,
  prefix: string,
  args: string[],
  uniCommand: UniCommand,
  client: Bot
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const commandUser: User = ctx.author || ctx.user || ctx.member?.user
  const channel = ctx.channel as GuildTextBasedChannel

  const { command } = uniCommand
  if (
    !ctx.guild?.members.me?.permissions.has(
      PermissionsBitField.resolve('SendMessages')
    )
  ) {
    await commandUser.dmChannel
      ?.send({
        content: `I don't have **\`SEND_MESSAGES\`** permission in <#${ctx.channelId}> to execute this **\`${command.name}\`** command.`
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})
    return true
  }

  if (
    !ctx.guild.members.me.permissions.has(
      PermissionsBitField.resolve('ViewChannel')
    )
  ) {
    return true
  }

  if (
    !ctx.guild.members.me.permissions.has(
      PermissionsBitField.resolve('EmbedLinks')
    )
  ) {
    await channel
      ?.send({
        content: `I don't have **\`EMBED_LINKS\`** permission in <#${ctx.channelId}> to execute this **\`${command.name}\`** command.`
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})
    return true
  }

  const embed = new EmbedBuilder().setColor(client.config.themeColors.ERROR)

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${commandUser}!`

    if (command.usage) {
      reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``
    }

    embed.setDescription(reply)
    channel?.send({ embeds: [embed] })
    return true
  }

  if (command.botPerms) {
    if (
      !ctx.guild.members.me.permissions.has(
        PermissionsBitField.resolve(command.botPerms || [])
      )
    ) {
      embed.setDescription(
        `I don't have **\`${command.botPerms}\`** permission in <#${ctx.channelId}> to execute this **\`${command.name}\`** command.`
      )
      channel?.send({ embeds: [embed] })
      return true
    }
  }
  if (command.userPerms) {
    if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      !ctx.member?.permissions.has(
        PermissionsBitField.resolve(command.userPerms || [])
      )
    ) {
      embed.setDescription(
        `You don't have **\`${command.userPerms}\`** permission in <#${ctx.channelId}> to execute this **\`${command.name}\`** command.`
      )
      channel?.send({ embeds: [embed] })
      return true
    }
  }

  if (command.owner && client.config.owners.includes(commandUser.id)) {
    embed.setDescription(
      `Only <@${client.config.owners[0]}> Can Use this Command`
    )
    channel?.send({ embeds: [embed] })
    return true
  }
  return false
}
