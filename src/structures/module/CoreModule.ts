import { Interaction, Message } from "discord.js";
import Bot from "../library/Client";
import { Module, ModuleContext } from "./Module";
import { EventBus } from "../eventbus/EventBus";
import CommandRegisterer from "../commands/Registerer";

/**
 * Built-in module that bridges Discord.js events into the framework.
 *
 * Responsibilities:
 *  1. Listens to `interactionCreate` → routes slash commands to CommandRegisterer
 *  2. Listens to `messageCreate` → routes prefix commands to CommandRegisterer
 *  3. Forwards raw Discord events through the EventBus (non-blocking)
 *     so other modules can observe them without touching the Discord client directly.
 *
 * Register this module LAST so all other modules' commands are already
 * loaded into the CommandRegisterer by the time onInit runs.
 *
 * @example
 * const bus = EventBus.create<MyEvents>({ tracing: true });
 * const modules = new ModuleRegisterer(bus);
 *
 * await modules.register([
 *   new MusicModule(),
 *   new PremiumModule(),
 *   new CoreModule(client),   // last — all commands wired before listeners attach
 * ]);
 *
 * await client.login();
 */
export class CoreModule extends Module {
  name = "core";

  private _interactionHandler?: (interaction: Interaction) => void;
  private _messageHandler?: (message: Message) => void;

  constructor(private client: Bot, private eventBus: EventBus, private commandRegisterer: CommandRegisterer) {
    super();
  }

  async onInit(ctx: ModuleContext) {
    this._interactionHandler = async (interaction: Interaction) => {
      this.eventBus.emit("interactionCreate", [interaction] as any).catch(() => {});

      if (interaction.isChatInputCommand()) {
        await this.commandRegisterer.handleApplicationCommandInteraction(
          interaction,
          this.client,
        );
      }
    };

    this._messageHandler = async (message: Message) => {
      if (message.author.bot) return;

      this.eventBus.emit("messageCreate", [message] as any).catch(() => {});

      await this.commandRegisterer.handlePrefixCommandInteraction(
        message,
        this.client,
      );
    };

    this.client.on("interactionCreate", this._interactionHandler);
    this.client.on("messageCreate", this._messageHandler);
  }

  async onDestroy() {
    if (this._interactionHandler) {
      this.client.off("interactionCreate", this._interactionHandler);
    }
    if (this._messageHandler) {
      this.client.off("messageCreate", this._messageHandler);
    }
  }
}
