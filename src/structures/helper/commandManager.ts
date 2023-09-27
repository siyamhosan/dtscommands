import chalk from 'chalk'
import { table } from 'table'
import { TableConfig } from '../base/Config.js'
import Bot from '../library/Client.js'

export async function CommandManager (
  client: Bot,
  exportedClasses: string[],
  allCommands: Record<string, any>
) {
  console.info(chalk.bold('Loading Prefix Commands...'), chalk.bold('pre'))
  const startLoading = Date.now()

  const contents = [['No.', 'Name', 'Category']]

  if (!exportedClasses) return

  for (const command of exportedClasses) {
    const CommandClass = allCommands[command]

    if (!CommandClass || typeof CommandClass !== 'function') {
      console.error(
        `Failed to load command ${command} from bundle, skipping...`
      )
      continue
    }

    const commandInstance = new CommandClass(client)

    if (commandInstance.name) {
      client.commands.set(commandInstance.name, commandInstance)
      commandInstance.aliases.forEach((alias: string) => {
        client.aliases.set(alias, commandInstance.name)
      })
      contents.push([
        `${client.commands.size}`,
        commandInstance.name,
        commandInstance.category
      ])
    }
  }
  table(contents, TableConfig)
    .split('\n')
    .forEach(text => {
      console.info(text, chalk.bold('pre'))
    })
  console.trace(
    startLoading,
    chalk.bold('Loaded Prefix Commands in: '),
    chalk.bold('pre')
  )
}
