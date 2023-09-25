/* eslint-disable new-cap */
import Bot from '../library/Client.js'
import chalk from 'chalk'
import { TableUserConfig, table } from 'table'
import { Event } from '../base/index.js'
import { ClientEvents } from 'discord.js'
import { readFileSync } from 'fs'

export async function EventManager (client: Bot) {
  const contents = [['No.', 'Name', 'Nick']]
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

  console.info(chalk.bold('Loading Events...'), chalk.bold('evt'))
  const startLoading = Date.now()

  const { exportedClasses } = JSON.parse(
    readFileSync('./.bundle/events-compiled.json', 'utf-8')
  )

  if (!exportedClasses) return

  const allEvents: Record<string, any> = await import(
    // @ts-ignore
    '../../bundle/events-bundle.js'
  )

  let i = 1
  for (const event of exportedClasses) {
    const eventClass = allEvents[event]

    if (!eventClass || typeof eventClass !== 'function') {
      console.error(`Failed to load event ${event} from bundle, skipping...`)
      continue
    }

    const eventInstance = new eventClass(client)

    if (eventInstance instanceof Event) {
      if (eventInstance.options.once) {
        client.once(
          eventInstance.options.name as keyof ClientEvents,
          eventInstance.run
        )
      } else {
        client.on(
          eventInstance.options.name as keyof ClientEvents,
          eventInstance.run
        )
      }
      contents.push([
        String(`${i++}.`),
        eventInstance.options.name,
        eventInstance.options.nick || '(None)'
      ])
    }
  }

  table(contents, config)
    .split('\n')
    .forEach(text => {
      console.info(text, chalk.bold('evt'))
    })
  console.trace(
    startLoading,
    chalk.bold('Loaded Events in: '),
    chalk.bold('evt')
  )
}
