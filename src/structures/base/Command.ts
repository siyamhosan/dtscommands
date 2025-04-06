import {
  Collection,
  EmbedBuilder,
  Message,
  PermissionResolvable,
  PermissionsBitField
} from 'discord.js'
import Bot from '../library/Client.js'
import { del9 } from '../utils/del.js'
import { CooldownConfigOptions, CooldownValidator } from './Cooldown.js'

export interface CommandRun {
  message: Message<true>
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
  validation?: string[]
  allowBot?: boolean
  guildOnly?: boolean
  cooldown?: CooldownConfigOptions
}

// make T type optional and default to string[] and supports enum
export abstract class Command<T = string[]> {
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
  readonly validation: string[] | T
  readonly allowBot: boolean
  readonly guildOnly: boolean
  readonly cooldown: CooldownConfigOptions | undefined

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
    this.allowBot = options.allowBot || false
    this.guildOnly = options.guildOnly || false
    this.cooldown = options.cooldown || undefined
  }

  public abstract run(options: CommandRun): void | Promise<void>
}

const Cooldown = new Collection<string, Date>()

export async function CommandValidator (
  message: Message<true>,
  prefix: string,
  args: string[],
  command: Command,
  client: Bot
): Promise<boolean> {
  // const getCooldownTime = () => {
  //   const cooldown = new Date()
  //   cooldown.setMilliseconds(
  //     cooldown.getMilliseconds() + client.config.cooldown * 1000
  //   )
  //   return cooldown
  // }

  // if (Cooldown.has(message.author.id)) {
  //   const cooldown = Cooldown.get(message.author.id)
  //   if (cooldown) {
  //     const now = new Date()
  //     const diff = now.getTime() - cooldown.getTime()
  //     const seconds = Math.floor(diff / 1000)
  //     const time = client.config.cooldown - seconds
  //     const cooldownTime = new Date()
  //     cooldownTime.setSeconds(cooldownTime.getSeconds() + time)

  //     const embed = new EmbedBuilder()
  //       .setColor(client.config.themeColors.ERROR)
  //       .setTitle('Cooldown')
  //     embed.setDescription(
  //       `You are on cooldown, please wait <t:${Math.floor(
  //         cooldownTime.getTime() / 1000
  //       )}:R> seconds before using this command again.`
  //     )
  //     message.channel
  //       .send({ embeds: [embed] })
  //       .then(msg => {
  //         setTimeout(() => {
  //           msg.delete()
  //         }, cooldownTime.getTime() - Date.now())
  //       })
  //       .catch(() => null)
  //     return true
  //   }
  // }

  // if (client.config.cooldown > 0) {
  //   Cooldown.set(message.author.id, getCooldownTime())
  //   setTimeout(() => {
  //     Cooldown.delete(message.author.id)
  //   }, client.config.cooldown * 1000)
  // }

  const isBlockedByCooldown = await CooldownValidator(message, client, command)
  if (isBlockedByCooldown) return true

  if (command.guildOnly && !message.guild) {
    return true
  }

  if (
    !message.guild?.members.me?.permissions.has(
      PermissionsBitField.resolve('SendMessages')
    )
  ) {
    await message.author.dmChannel
      ?.send({
        content: `I don't have **\`SEND_MESSAGES\`** permission in <#${message.channelId}> to execute this **\`${command.name}\`** command.`
      })
      .catch(() => null)
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
      .catch(() => null)

    return true
  }

  const embed = new EmbedBuilder().setColor(client.config.themeColors.ERROR)

  if (command.validation.length > 0) {
    for (const validation of command.validation) {
      const customValidation = client.config.customValidations?.find(
        customValidation => customValidation.name === validation
      )
      if (!customValidation) {
        console.warn(`Custom validation ${validation} not found`)
        continue
      }

      if (
        !(await customValidation.validate({
          message,
          interaction: undefined
        }))
      ) {
        const messageOptions =
          typeof customValidation.onFail === 'function'
            ? await customValidation.onFail({ message })
            : customValidation.onFail

        if (typeof messageOptions === 'string') {
          embed.setDescription(messageOptions)
          message.channel.send({ embeds: [embed] })
        } else {
          try {
            message.channel
              .send(messageOptions)
              .then(del9)
              .catch(() => null)
          } catch (error) {}
        }

        return true
      }
    }
  }

  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}!`

    if (command.usage) {
      reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``
    }

    embed.setDescription(reply)
    message.channel
      .send({ embeds: [embed] })
      .then(del9)
      .catch(() => null)
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

  return false
}
