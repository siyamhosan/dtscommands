import chalk from 'chalk'
import { table } from 'table'
import { TableConfig } from '../base/Config.js'
import Bot from '../library/Client.js'
import { ButtonEvent } from '../events/buttons.js'
import { ButtonManager } from '../base/ButtonManager.js'

export async function ButtonsManager (
  client: Bot,
  exportedClasses: string[],
  allButtons: Record<string, any>
) {
  if (!client.config.isSharding) {
    console.info(chalk.bold('Loading Button Managers...'), chalk.bold('btn'))
  }
  const startLoading = Date.now()

  const contents = [['No.', 'Nickname', 'Category']]

  if (!exportedClasses) return

  for (const button of exportedClasses) {
    const CommandClass = allButtons[button]

    if (!CommandClass || typeof CommandClass !== 'function') {
      console.error(`Failed to load button ${button} from bundle, skipping...`)
      continue
    }

    const commandInstance = new CommandClass(client) as ButtonManager

    if (commandInstance.customIdValidation) {
      client.buttons.set(commandInstance.customIdValidation, commandInstance)
      contents.push([
        `${client.buttons.size}`,
        commandInstance.nickname,
        commandInstance.category
      ])
    }
  }
  if (!client.config.isSharding) {
    table(contents, TableConfig)
      .split('\n')
      .forEach(text => {
        console.info(text, chalk.bold('btn'))
      })
    console.trace(
      startLoading,
      chalk.bold('Loaded Buttons in: '),
      chalk.bold('btn')
    )
  }
}
