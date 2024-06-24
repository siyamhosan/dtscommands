import chalk from 'chalk'
import { ButtonInteraction, Message } from 'discord.js'
import { CommandValidator } from '../base/Command.js'
import { Event } from '../base/Event.js'
import { UniCommandValidator } from '../base/UniCommand.js'
import Bot from '../library/Client.js'
import { ButtonValidation } from '../base/ButtonManager.js'

export class ButtonEvent extends Event<'interactionCreate'> {
  private client: Bot

  constructor (client: Bot) {
    super({
      name: 'interactionCreate',
      nick: 'preButtonsDirecter'
    })
    this.client = client
  }

  async run (interaction: ButtonInteraction) {
    if (!interaction.isButton()) return
    const client = this.client

    const buttonHandler = client.buttons.get(interaction.customId)
    if (!buttonHandler) return

    if (await ButtonValidation(interaction, buttonHandler, client)) return

    try {
      buttonHandler.run({
        interaction,
        client,
        customId: interaction.customId
      })
    } catch (err) {
      console.warn(chalk.redBright(err), 'cmd')
      interaction.reply({
        content: 'There was an error trying to execute that command!',
        ephemeral: true
      })
    }
  }
}
