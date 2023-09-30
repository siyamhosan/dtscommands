import chalk from 'chalk'
import { Collection, Message } from 'discord.js'
import { CommandValidator, Event, UniCommandValidator } from '../base/index.js'
import Bot from '../library/Client.js'

const Cooldown = new Collection<string, boolean>()

export class CommandsEvent extends Event<'messageCreate'> {
  private client: Bot

  constructor (client: Bot) {
    super({
      name: 'messageCreate',
      nick: 'preCommandsDirecter'
    })
    this.client = client
  }

  async run (message: Message) {
    if (message.author.bot) return
    const client = this.client
    const prefix = client.config.prefix

    if (Cooldown.has(message.author.id)) return message.reply('Cooldown ¬!!')

    Cooldown.set(message.author.id, true)
    setTimeout(() => {
      Cooldown.delete(message.author.id)
    }, client.config.cooldown * 1000)

    const mention = new RegExp(`^<@!?${client.user?.id}>( |)$`)
    if (message.content.match(mention)) {
      message.channel.send(
        // @ts-ignore
        client.config.mentionMessage
      )
    }
    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const prefixRegex = new RegExp(
      `^(<@!?${client.user?.id}>|${escapeRegex(prefix)})\\s*`
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
        message.reply({
          content: 'There was an error trying to execute that command!'
        })
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
