/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { table } from 'table'
import { TableConfig } from '../base/Config.js'
import Bot from '../library/Client.js'

export const SlashManager = async (
  client: Bot,
  exportedClasses: string[],
  allSlashCommands: Record<string, any>
) => {
  const contents = [['No.', 'Name', 'Type']]

  const startTime = Date.now()

  console.info(
    chalk.bold('Loading Slash And Uni Commands...'),
    chalk.bold('sla')
  )

  if (!exportedClasses) return

  let i = 1
  const data: SlashCommandBuilder[] = []
  for (const slash of exportedClasses) {
    const SlashClass = allSlashCommands[slash]

    if (!SlashClass || typeof SlashClass !== 'function') {
      console.error(
        `Failed to load slash command ${slash} from bundle, skipping...`
      )
      continue
    }

    const slashInstance = new SlashClass(client)

    if (slashInstance.subCommand) {
      client.subCommands.set(slashInstance.subCommand, slashInstance)
      return
    }

    client.slashCommands.set(
      slashInstance.data?.name || 'default',
      slashInstance
    )

    if (slashInstance.data) data.push(slashInstance.data)

    contents.push([
      String(`${i++}.`),
      slashInstance.data?.name || 'default',
      'Slash'
    ])
  }

  table(contents, TableConfig)
    .split('\n')
    .forEach(text => {
      console.info(text, chalk.bold('sla'))
    })

  console.trace(
    startTime,
    chalk.bold('Loaded Slash Commands In '),
    chalk.bold('sla')
  )

  const rest = new REST({ version: '10' }).setToken(client.config.token || '')
  ;(async () => {
    try {
      console.info('Started refreshing application (/) commands.', 'cmd')
      await rest.put(Routes.applicationCommands(client.user?.id || '000'), {
        body: data
      })
      console.info('Successfully reloaded application (/) commands.', 'cmd')
    } catch (error) {
      console.error(error)
    }
  })()
}
