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
  console.info(chalk.bold('Loading Button Managers...'), chalk.bold('btn'))
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

    if (commandInstance.customId) {
      client.buttons.set(commandInstance.customId, commandInstance)
      contents.push([
        `${client.commands.size}`,
        commandInstance.nickname,
        commandInstance.category
      ])
    }
  }
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
