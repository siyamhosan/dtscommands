import {
  Collection,
  EmbedBuilder,
  Message,
  PermissionResolvable,
  PermissionsBitField
} from 'discord.js'
import Bot from '../library/Client.js'

export interface CommandRun {
  message: Message
  args: string[]
  client: Bot
  prefix: string
}

export interface CommandOptions {
  name: string
  category: string
  description: string
  args?: boolean
  usage?: string
  aliases?: string[]
  userPerms?: PermissionResolvable[]
  botPerms?: PermissionResolvable[]
  owner?: boolean
  manager?: boolean
  beta?: boolean
  /**
   *  @beta
   */
  validation?: string[]
}

export abstract class Command {
  readonly name: string
  readonly category: string
  readonly description: string
  readonly args: boolean
  readonly usage: string
  readonly aliases: string[]
  readonly userPerms: PermissionResolvable[]
  readonly botPerms: PermissionResolvable[]
  readonly owner: boolean
  readonly manager: boolean
  readonly beta: boolean
  readonly validation: string[]

  constructor (options: CommandOptions) {
    this.name = options.name
    this.category = options.category
    this.description = options.description
    this.args = options.args || false
    this.usage = options.usage || ''
    this.aliases = options.aliases || []
    this.userPerms = options.userPerms || []
    this.botPerms = options.botPerms || []
    this.owner = options.owner || false
    this.manager = options.manager || false
    this.beta = options.beta || false
    this.validation = options.validation || []
  }

  public abstract run(options: CommandRun): void
}

const Cooldown = new Collection<string, Date>()

export async function CommandValidator (
  message: Message,
  prefix: string,
  args: string[],
  command: Command,
  client: Bot
): Promise<boolean> {
  const getCooldownTime = () => {
    const cooldown = new Date()
    cooldown.setMilliseconds(
      cooldown.getMilliseconds() + client.config.cooldown * 1000
    )
    return cooldown
  }

  if (Cooldown.has(message.author.id)) {
    const cooldown = Cooldown.get(message.author.id)
    if (cooldown) {
      const now = new Date()
      const diff = now.getTime() - cooldown.getTime()
      const seconds = Math.floor(diff / 1000)
      const time = client.config.cooldown - seconds
      const embed = new EmbedBuilder()
        .setColor(client.config.themeColors.ERROR)
        .setTitle('Cooldown')
      embed.setDescription(
        `You are on cooldown, please wait **${time}** seconds before using this command again.`
      )
      message.channel.send({ embeds: [embed] })
      return true
    }
  }

  Cooldown.set(message.author.id, getCooldownTime())
  setTimeout(() => {
    Cooldown.delete(message.author.id)
  }, client.config.cooldown * 1000)

  if (
    !message.guild?.members.me?.permissions.has(
      PermissionsBitField.resolve('SendMessages')
    )
  ) {
    await message.author.dmChannel
      ?.send({
        content: `I don't have **\`SEND_MESSAGES\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})
    return true
  }

  if (
    !message.guild.members.me.permissions.has(
      PermissionsBitField.resolve('ViewChannel')
    )
  ) {
    return true
  }

  if (
    !message.guild.members.me.permissions.has(
      PermissionsBitField.resolve('EmbedLinks')
    )
  ) {
    await message.channel
      .send({
        content: `I don't have **\`EMBED_LINKS\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {})

    return true
  }

  const embed = new EmbedBuilder().setColor(client.config.themeColors.ERROR)

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`

    if (command.usage) {
      reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``
    }

    embed.setDescription(reply)
    message.channel.send({ embeds: [embed] })
    return true
  }

  if (command.botPerms) {
    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.resolve(command.botPerms || [])
      )
    ) {
      embed.setDescription(
        `I don't have **\`${command.botPerms}\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`
      )
      message.channel.send({ embeds: [embed] })
      return true
    }
  }
  if (command.userPerms) {
    if (
      !message.member?.permissions.has(
        PermissionsBitField.resolve(command.userPerms || [])
      )
    ) {
      embed.setDescription(
        `You don't have **\`${command.userPerms}\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`
      )
      message.channel.send({ embeds: [embed] })
      return true
    }
  }

  if (command.owner && !client.config.owners?.includes(message.author.id)) {
    embed.setDescription(
      `Only <@${client.config.owners[0] || 'mr. unknown'}> Can Use this Command`
    )

    message.channel.send({ embeds: [embed] })
    return true
  }

  if (command.validation.length > 0) {
    for (const validation of command.validation) {
      const customValidation = client.config.customValidations?.find(
        customValidation => customValidation.name === validation
      )
      if (!customValidation) continue

      if (
        !customValidation.validate({
          message,
          interaction: undefined
        })
      ) {
        embed.setDescription(customValidation.onFail)
        message.channel.send({ embeds: [embed] })
        return true
      }
    }
  }

  return false
}
