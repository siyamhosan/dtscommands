import { Interaction } from 'discord.js'
import { Event } from '../base/Event.js'
import { UniCommandValidator } from '../base/UniCommand.js'
import { SlashCommandValidator } from '../base/SlashCommand.js'
import Bot from '../library/Client.js'

export class InteractionCommandEvent extends Event<'interactionCreate'> {
  private client: Bot

  constructor (client: Bot) {
    super({
      name: 'interactionCreate',
      nick: 'SlashCommandsDirecter'
    })
    this.client = client
  }

  run (interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return
    const client = this.client

    const slashCommand = client.slashCommands.get(interaction.commandName)
    const subCommand = interaction.options.getSubcommand(false)
    const uniCommand = client.uniCommands.get(interaction.commandName)
    if (slashCommand) {
      SlashCommandValidator(interaction, slashCommand, this.client)

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        slashCommand.run({
          interaction,
          client
        })
      } catch (err) {
        console.error(err)
        if (interaction.replied) {
          return interaction.editReply({
            content: 'There was an error while executing this command!'
          })
        }
        interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        })
      }
    } else if (subCommand) {
      const subCommandFile = client.subCommands.get(subCommand)
      if (!subCommandFile) {
        return interaction.reply({
          content: ' This sub command is outdated.',
          ephemeral: true
        })
      }
      SlashCommandValidator(interaction, subCommandFile, this.client)

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        subCommandFile.run({
          interaction,
          client
        })
      } catch (err) {
        console.error(err)
        if (interaction.replied) {
          return interaction.editReply({
            content: 'There was an error while executing this command!'
          })
        }
        interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        })
      }
    } else if (uniCommand) {
      UniCommandValidator(interaction, '', [], uniCommand, client)

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        uniCommand.run({
          ctx: interaction,
          client
        })
      } catch (err) {
        console.error(err)
        if (interaction.replied) {
          return interaction.editReply({
            content: 'There was an error while executing this command!'
          })
        }
        interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        })
      }
    }
  }
}
