/* eslint-disable new-cap */
import { Client, ClientOptions, Collection } from 'discord.js'
import { Command } from '../base/Command.js'
import { Config, defaultConfig } from '../base/Config.js'
import { SlashCommand } from '../base/SlashCommand.js'
import { UniCommand } from '../base/UniCommand.js'
import { botCommandEventsManager } from '../events/index.js'
import Logger from './Logger.js'
import { ButtonManager } from '../base/ButtonManager.js'
import { CooldownManager } from '../base/Cooldown.js'

class Bot extends Client {
  public readonly config: Required<Config>
  public readonly commands: Collection<string, Command>
  public readonly aliases: Collection<string, string>
  public readonly slashCommands: Collection<string, SlashCommand>
  public readonly subCommands: Collection<string, SlashCommand>
  public readonly uniCommands: Collection<string, UniCommand>
  public readonly buttons: Collection<
    (customId: string) => boolean,
    ButtonManager
  >
  // a collections object there people can add their own collections to it then it will be accessible in the client
  public collections: Record<string, Collection<string, unknown>> = {}
  // a services object there people can add their own services classes to it then it will be accessible in the client
  public services: Record<string, unknown> = {}

  public readonly cooldownManager = new CooldownManager()

  constructor (config?: Config) {
    const superConfig: ClientOptions = {
      intents: config?.intents ?? defaultConfig.intents,
      partials: config?.partials ?? defaultConfig.partials
    }

    if (config?.isSharding) {
      superConfig.shards = config.shards
      superConfig.shardCount = config.shardCount
    }

    super(superConfig)

    this.config = { ...defaultConfig, ...config }

    this.commands = new Collection()
    this.aliases = new Collection()
    this.slashCommands = new Collection()
    this.subCommands = new Collection()
    this.uniCommands = new Collection()
    this.buttons = new Collection()
    Logger()
  }

  // private async compiler () {
  //   const cmds = [
  //     { path: this.config.eventsDir, of: 'events' },
  //     { path: this.config.commandsDir, of: 'commands' },
  //     { path: this.config.slashCommandsDir, of: 'slashCommands' },
  //     { path: this.config.uniCommandsDir, of: 'uniCommands' }
  //   ]
  //   console.debug('Compiling...')

  //   let done = 0
  //   for (const cmd of cmds) {
  //     await Compiler(cmd.path, cmd.of)
  //     done++
  //   }

  //   console.debug('Compiled!')
  // }

  // public async reloadEvents () {
  //   this.removeAllListeners()
  //   await Compiler(this.config.eventsDir, 'events')
  //   await EventManager(this)
  // }

  // public async reloadCommands () {
  //   this.commands.clear()
  //   await Compiler(this.config.commandsDir, 'commands')
  //   await CommandManager(this)
  // }

  // public async reloadSlash () {
  //   this.slashCommands.clear()
  //   this.uniCommands.clear()
  //   this.subCommands.clear()
  //   await Compiler(this.config.slashCommandsDir, 'slashCommands')
  //   await SlashManager(this)
  // }

  // public async watcher () {
  //   const eventFiles =
  //     JSON.parse(
  //       readFileSync(
  //         this.config.eventsDir + '/bundle/events-compiled.json',
  //         'utf-8'
  //       )
  //     ).filesPaths || []
  //   const CommandFiles =
  //     JSON.parse(
  //       readFileSync(
  //         this.config.commandsDir + '/bundle/commands-compiled.json',
  //         'utf-8'
  //       )
  //     ).filesPaths || []
  //   const SlashFiles =
  //     JSON.parse(
  //       readFileSync(
  //         this.config.slashCommandsDir + '/bundle/slashCommands-compiled.json',
  //         'utf-8'
  //       )
  //     ).filesPaths || []

  //   const UniFiles =
  //     JSON.parse(
  //       readFileSync(
  //         this.config.uniCommandsDir + '/bundle/uniCommands-compiled.json',
  //         'utf-8'
  //       )
  //     ).filesPaths || []

  //   for (const file of eventFiles) {
  //     watchFile(file, async () => {
  //       console.warn('Reloading Events - on Change')
  //       await this.reloadEvents()
  //     })
  //   }

  //   for (const file of CommandFiles) {
  //     watchFile(file, async () => {
  //       console.warn('Reloading Commands - on Change')
  //       await this.reloadCommands()
  //     })
  //   }

  //   for (const file of SlashFiles) {
  //     watchFile(file, async () => {
  //       console.warn('Reloading Slash Commands - on Change')
  //       await this.reloadSlash()
  //     })
  //   }

  //   for (const file of UniFiles) {
  //     watchFile(file, async () => {
  //       console.warn('Reloading Uni Commands - on Change')
  //       await this.reloadSlash()
  //     })
  //   }
  // }

  override async login () {
    const startUp = Date.now()

    // await this.compiler()

    if (this.config.monitor) {
      console.warn('Monitoring is enabled')
      // this.watcher()
    }

    botCommandEventsManager(this)

    console.trace(startUp, 'Client Started in', 'BOT')
    return super.login(this.config.token)
  }
}

export default Bot
