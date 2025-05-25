import chalk from 'chalk'
import { ButtonInteraction } from 'discord.js'
import { Event } from '../base/Event.js'
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

    // Get button handler from the latest collection reference
    let buttonHandler = undefined
    for (const [validator, handler] of client.buttons.entries()) {
      if (validator(interaction.customId)) {
        buttonHandler = handler
        break
      }
    }

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
