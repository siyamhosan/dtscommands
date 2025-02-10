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

  async run (interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return
    const client = this.client

    const slashCommand = client.slashCommands.get(interaction.commandName)
    const subCommand = interaction.options.getSubcommand(false)

    if (subCommand) {
      const subCommandFile = client.subCommands.get(
        interaction.commandName + '.' + subCommand
      )

      if (!subCommandFile) {
        return interaction.reply({
          content: ' This sub command is outdated.',
          ephemeral: true
        })
      }
      const validation = await SlashCommandValidator(
        interaction,
        subCommandFile,
        this.client
      )

      if (validation) return

      try {
        if (!subCommandFile.run)
          return interaction.reply({
            content: 'This sub command is outdated.',
            ephemeral: true
          })
        subCommandFile.run({
          client,
          interaction,
          options: interaction.options
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
    } else if (slashCommand) {
      const validation = SlashCommandValidator(
        interaction,
        slashCommand,
        this.client
      )

      if (!validation) return

      try {
        if (!slashCommand.run)
          return interaction.reply({
            content: 'This command is outdated.',
            ephemeral: true
          })
        slashCommand.run({
          interaction,
          client,
          options: interaction.options
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
    } else {
      if (interaction.replied) {
        return interaction.editReply({
          content: 'This command is outdated.'
        })
      } else {
        return interaction.reply({
          content: 'This command is outdated.',
          ephemeral: true
        })
      }
    }
  }
}
