/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk'
import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { readFileSync } from 'node:fs'
import { TableUserConfig, table } from 'table'
import Bot from '../library/Client.js'

export const SlashManager = async (client: Bot) => {
  const contents = [['No.', 'Name', 'Type']]
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

  const startTime = Date.now()

  console.info(
    chalk.bold('Loading Slash And Uni Commands...'),
    chalk.bold('sla')
  )

  const { exportedClasses } = JSON.parse(
    readFileSync(
      client.config.slashCommandsDir + '/bundle/slashCommands-compiled.json',
      'utf-8'
    )
  )

  if (!exportedClasses) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSlashCommands: Record<string, any> = await import(
    client.config.slashCommandsDir + '/bundle/slashCommands-bundled.js'
  )

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

  i = 1

  const allUniCommands: Record<string, any> = await import(
    client.config.uniCommandsDir + '/bundle/uniCommands-bundled.js'
  )
  const uniBundle = JSON.parse(
    readFileSync(
      client.config.uniCommandsDir + '/bundle/uniCommands-compiled.json',
      'utf-8'
    )
  )

  const uniClasses = uniBundle.exportedClasses

  for (const uni of uniClasses) {
    const UniClass = allUniCommands[uni]
    const uniInstance = new UniClass(client)

    client.uniCommands.set(uniInstance.slash.name, uniInstance)
    data.push(uniInstance.slash)

    contents.push([String(`${i++}.`), uniInstance.slash.name, 'Uni'])
  }

  await table(contents, config)
    .split('\n')
    .forEach(text => {
      console.info(text, chalk.bold('sla'))
    })

  console.trace(
    startTime,
    chalk.bold('Loaded Slash And Uni Commands In '),
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
