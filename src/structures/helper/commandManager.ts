import Bot from '../library/Client.js'
import chalk from 'chalk'
import { TableUserConfig, table } from 'table'
import { readFileSync } from 'fs'

export async function CommandManager (client: Bot) {
  console.info(chalk.bold('Loading Prefix Commands...'), chalk.bold('pre'))
  const startLoading = Date.now()

  const contents = [['No.', 'Name', 'Category']]
  const config: TableUserConfig = {
    drawHorizontalLine: (lineIndex: number, rowCount: number) => {
      return lineIndex === 1 || lineIndex === 0 || lineIndex === rowCount
    },

    border: {
      topBody: chalk.gray('─'),
      topJoin: chalk.gray('┬'),
      topLeft: chalk.gray('┌'),
      topRight: chalk.gray('┐'),

      bottomBody: chalk.gray('─'),
      bottomJoin: chalk.gray('┴'),
      bottomLeft: chalk.gray('└'),
      bottomRight: chalk.gray('┘'),

      bodyLeft: chalk.gray('│'),
      bodyRight: chalk.gray('│'),
      bodyJoin: chalk.gray('│'),

      joinBody: chalk.gray('─'),
      joinLeft: chalk.gray('├'),
      joinRight: chalk.gray('┤'),
      joinJoin: chalk.gray('┼')
    }
  }

  const { exportedClasses } = JSON.parse(
    readFileSync(
      client.config.commandsDir + '/bundle/commands-compiled.json',
      'utf-8'
    )
  )

  if (!exportedClasses) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCommands: Record<string, any> = await import(
    client.config.commandsDir + '/bundle/commands-bundled.js'
  )

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
  table(contents, config)
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
