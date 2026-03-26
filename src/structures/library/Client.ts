/* eslint-disable new-cap */
import { Client, ClientOptions, Collection, REST } from "discord.js";
import { Config, defaultConfig } from "../base/Config.js";
import { CooldownManager } from "../base/Cooldown.js";
import { createLogger } from "./Logger.js";

class Bot extends Client {
  public readonly config: Required<Config>;

  public readonly cooldownManager = new CooldownManager();

  /** Library logger — does not replace global `console`. */
  public readonly logger = createLogger({ group: "BOT" });

  constructor(config?: Config) {
    const superConfig: ClientOptions = {
      intents: config?.intents ?? defaultConfig.intents,
      partials: config?.partials ?? defaultConfig.partials,
    };

    super(superConfig);

    this.config = { ...defaultConfig, ...config };
  }

  override async login(token: string = process.env.TOKEN ?? "") {
    const startUp = Date.now();

    if (!token) {
      throw new Error("Token is required");
    }

    this.logger.trace(startUp, "Client Started in");
    return super.login(token);
  }
}

export default Bot;
