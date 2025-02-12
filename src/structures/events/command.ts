import chalk from 'chalk'
import { EmbedBuilder, Message } from 'discord.js'
import { CommandValidator } from '../base/Command.js'
import { Event } from '../base/Event.js'
import { UniCommandValidator } from '../base/UniCommand.js'
import Bot from '../library/Client.js'
import { ValidationError } from '../library/Error.js'

export class CommandsEvent extends Event<'messageCreate'> {
  private client: Bot

  constructor (client: Bot) {
    super({
      name: 'messageCreate',
      nick: 'preCommandsDirecter'
    })
    this.client = client
  }

  async run (message: Message<true>) {
    const client = this.client
    const prefix = client.config.prefix

    const mention = new RegExp(`^<@!?${client.user?.id}>( |)$`)
    if (message.content.match(mention)) {
      const messageContent =
        typeof client.config.mentionMessage === 'function'
          ? client.config.mentionMessage(message)
          : client.config.mentionMessage

      message.channel.send(messageContent)
    }
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const prefixRegex = new RegExp(
      `^(<@!?${client.user?.id}>|${escapeRegex(prefix)}${
        client.config.additionalPrefixes.length > 0
          ? `|${client.config.additionalPrefixes.map(escapeRegex).join('|')}`
          : ''
      })\\s*`
    )
    if (!prefixRegex.test(message.content)) return

    const [matchedPrefix] = message.content.match(prefixRegex) || ['']

    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase() || ''

    const command =
      client.commands.get(commandName) ||
      client.commands.find(
        cmd => cmd.aliases && cmd.aliases.includes(commandName)
      )

    const uniCommand =
      client.uniCommands.get(commandName) ||
      client.uniCommands.find(
        cmd => cmd.command.aliases && cmd.command.aliases.includes(commandName)
      )

    if (command) {
      if (message.author.bot && !command.allowBot) return
      if (await CommandValidator(message, prefix, args, command, client)) return

      try {
        command.run({
          message,
          args,
          client,
          prefix
        })
      } catch (err) {
        console.warn(chalk.redBright(err), 'cmd')
        if (err instanceof ValidationError) {
          const embed = new EmbedBuilder().setColor(
            client.config.themeColors.ERROR
          )

          embed.setDescription(err.message)
          embed.setTitle('Validation Error')
          embed.setTimestamp()

          message
            .reply({
              embeds: [embed]
            })
            .then(msg => {
              setTimeout(() => {
                msg.delete()
              }, err.ttl * 1000)
            })
        } else {
          message.reply({
            content: 'There was an error trying to execute that command!'
          })
        }
      }
    } else if (uniCommand) {
      if (
        await UniCommandValidator(message, prefix, args, uniCommand, client)
      ) {
        return
      }

      try {
        uniCommand.run({
          ctx: message,
          args,
          client,
          prefix
        })
      } catch (err) {
        console.warn(chalk.redBright(err), 'ucd')
        message.reply({
          content: 'There was an error trying to execute that command!'
        })
      }
    }
  }
}
