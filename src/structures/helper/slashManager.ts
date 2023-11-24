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

  if (
    !exportedClasses ||
    typeof exportedClasses !== 'object' ||
    !exportedClasses.length
  ) {
    console.error(
      'Failed to load slash commands from bundle, skipping slash...'
    )
    return
  }

  let i = 1
  let subCount = 0
  const data: SlashCommandBuilder[] = []
  for (const slash of exportedClasses) {
    const SlashClass = allSlashCommands[slash]

    if (!SlashClass || typeof SlashClass !== 'function') {
      console.error(
        `Failed to load slash command ${slash} from bundle, skipping...`,
        'sla'
      )
      continue
    }

    const slashInstance = new SlashClass(client)

    if (slashInstance.subCommand) {
      contents.push([
        String(`${i++}.`),
        slashInstance.data?.name || 'default',
        'Sub'
      ])
      client.subCommands.set(slashInstance.subCommand, slashInstance)
      subCount++
      continue
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

  contents.push([
    String(`${i - subCount}.`),
    ' of Total Slash Commands',
    'Slash'
  ])
  contents.push([String(`${subCount}.`), ' of Total Sub Commands', 'Sub'])

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

      const clientId = client.config.clientId
      if (!clientId) {
        throw new Error(
          'Missing client id. Please set CLIENT_ID in .env or client constructor.'
        )
      }

      await rest.put(Routes.applicationCommands(clientId), {
        body: data
      })
      console.info('Successfully reloaded application (/) commands.', 'cmd')
    } catch (error) {
      console.error(error)
    }
  })()
}
