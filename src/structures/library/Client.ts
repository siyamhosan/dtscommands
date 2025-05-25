/* eslint-disable new-cap */
import { Client, ClientOptions, Collection, REST, Routes } from 'discord.js'
import { Command } from '../base/Command.js'
import { Config, defaultConfig } from '../base/Config.js'
import { SlashCommand } from '../base/SlashCommand.js'
import { UniCommand } from '../base/UniCommand.js'
import { botCommandEventsManager } from '../events/index.js'
import Logger from './Logger.js'
import { ButtonManager } from '../base/ButtonManager.js'
import { CooldownManager } from '../base/Cooldown.js'

class Bot extends Client {
  public rest: REST
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
    this.rest = new REST().setToken(this.config.token)

    this.commands = new Collection()
    this.aliases = new Collection()
    this.slashCommands = new Collection()
    this.subCommands = new Collection()
    this.uniCommands = new Collection()
    this.buttons = new Collection()
    Logger()
  }

  // Dynamic Command Management Methods

  /**
   * Add a command to the bot at runtime
   * @param command The command instance to add
   */
  public addCommand (command: Command) {
    console.debug(`[Commands] Adding command: ${command.name}`)
    this.commands.set(command.name, command)
    if (command.aliases) {
      command.aliases.forEach(alias => {
        console.debug(`[Commands] Adding alias: ${alias} -> ${command.name}`)
        this.aliases.set(alias, command.name)
      })
    }
  }

  /**
   * Remove a command from the bot at runtime
   * @param commandName The name of the command to remove
   */
  public removeCommand (commandName: string) {
    console.debug(`[Commands] Removing command: ${commandName}`)
    const command = this.commands.get(commandName)
    if (command) {
      this.commands.delete(commandName)
      if (command.aliases) {
        command.aliases.forEach(alias => {
          console.debug(`[Commands] Removing alias: ${alias}`)
          this.aliases.delete(alias)
        })
      }
    }
  }

  private async registerSlashCommands () {
    if (!this.application?.id) {
      throw new Error('Client application ID not found')
    }

    const commands = [...this.slashCommands.values()].map(cmd => cmd.data)

    console.debug(
      `[Slash] Registering ${commands.length} slash commands with Discord API`
    )
    try {
      await this.rest.put(Routes.applicationCommands(this.application.id), {
        body: commands
      })
      console.debug('[Slash] Successfully registered slash commands')
    } catch (error) {
      console.error('[Slash] Failed to register slash commands:', error)
      throw error
    }
  }

  /**
   * Add a slash command to the bot at runtime
   * @param command The slash command instance to add
   */
  public async addSlashCommand (command: SlashCommand) {
    console.debug(`[Slash] Adding slash command: ${command.data?.name}`)
    if (command.subCommand) {
      this.subCommands.set(command.subCommand, command)
    } else {
      if (command.data?.name) {
        this.slashCommands.set(command.data.name, command)
        // Register the new command with Discord
        await this.registerSlashCommands()
      }
    }
  }

  /**
   * Remove a slash command from the bot at runtime
   * @param commandName The name of the slash command to remove
   * @param subCommand Optional sub-command name if removing a sub-command
   */
  public async removeSlashCommand (commandName: string, subCommand?: string) {
    console.debug(
      `[Slash] Removing slash command: ${commandName}${
        subCommand ? ` (sub: ${subCommand})` : ''
      }`
    )
    if (subCommand) {
      this.subCommands.delete(commandName + '.' + subCommand)
    } else {
      this.slashCommands.delete(commandName)
      // Update registered commands with Discord
      await this.registerSlashCommands()
    }
  }

  /**
   * Add a button handler to the bot at runtime
   * @param button The button manager instance to add
   */
  public addButton (button: ButtonManager) {
    console.debug('[Button] Adding button handler')
    this.buttons.set(button.customIdValidation, button)
  }

  /**
   * Remove a button handler from the bot at runtime
   * @param customIdValidator The custom ID validation function used to identify the button handler
   */
  public removeButton (customIdValidator: (customId: string) => boolean) {
    console.debug('[Button] Removing button handler')
    this.buttons.delete(customIdValidator)
  }

  // Bulk update methods for efficiency

  /**
   * Replace all commands with a new set of commands
   * @param commands Array of command instances to replace the current commands
   */
  public async updateCommands (commands: Command[]) {
    console.debug(`[Commands] Bulk updating ${commands.length} commands`)
    this.commands.clear()
    this.aliases.clear()
    commands.forEach(cmd => this.addCommand(cmd))
  }

  /**
   * Replace all slash commands with a new set of slash commands
   * @param commands Array of slash command instances to replace the current slash commands
   */
  public async updateSlashCommands (commands: SlashCommand[]) {
    console.debug(`[Slash] Bulk updating ${commands.length} slash commands`)
    this.slashCommands.clear()
    this.subCommands.clear()
    commands.forEach(cmd => this.addSlashCommand(cmd))
    // Register all commands with Discord
    await this.registerSlashCommands()
  }

  /**
   * Replace all button handlers with a new set of button handlers
   * @param buttons Array of button manager instances to replace the current button handlers
   */
  public async updateButtons (buttons: ButtonManager[]) {
    console.debug(`[Button] Bulk updating ${buttons.length} button handlers`)
    this.buttons.clear()
    buttons.forEach(btn => this.addButton(btn))
  }

  /**
   * Get statistics about currently loaded commands
   * @returns Object containing counts of all command types
   */
  public getCommandStats () {
    return {
      commands: this.commands.size,
      aliases: this.aliases.size,
      slashCommands: this.slashCommands.size,
      subCommands: this.subCommands.size,
      uniCommands: this.uniCommands.size,
      buttons: this.buttons.size
    }
  }

  override async login () {
    const startUp = Date.now()

    if (this.config.monitor) {
      console.warn('Monitoring is enabled')
    }

    botCommandEventsManager(this)

    console.trace(startUp, 'Client Started in', 'BOT')
    return super.login(this.config.token)
  }
}

export default Bot
