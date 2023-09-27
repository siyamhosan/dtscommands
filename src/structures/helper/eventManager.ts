/* eslint-disable new-cap */
import chalk from 'chalk'
import { ClientEvents } from 'discord.js'
import { table } from 'table'
import { TableConfig } from '../base/Config.js'
import { Event } from '../base/index.js'
import Bot from '../library/Client.js'

export async function EventManager (
  client: Bot,
  exportedClasses: string[],
  allEvents: Record<string, any>
) {
  const contents = [['No.', 'Name', 'Nick']]

  console.info(chalk.bold('Loading Events...'), chalk.bold('evt'))
  const startLoading = Date.now()

  if (!exportedClasses) return

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

  table(contents, TableConfig)
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
