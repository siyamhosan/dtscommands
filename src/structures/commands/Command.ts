import { SlashCommandBuilder } from "discord.js";
import Bot from "../library/Client";
import { CommandLoaderContext, CommandOptions, CommandRun } from "./type";

export abstract class Command {
  public slashCommand?: SlashCommandBuilder;
  public options: CommandOptions = {};

  constructor(
    options?: CommandOptions,
    public context?: CommandLoaderContext,
  ) {
    this.options = options || {};
  }

  public abstract registerApplicationCommands(
    client: Bot,
  ): void | Promise<void>;

  public abstract run(options: CommandRun): (void | any) | Promise<void | any>;
}
