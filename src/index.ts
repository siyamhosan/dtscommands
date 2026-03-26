import "dotenv/config";

export { default, default as Bot } from "./structures/library/Client.js";

export * from "./structures/base/Config.js";
export * from "./structures/base/Cooldown.js";
export { PrefixManager } from "./structures/base/prefixManager.js";

export { Command } from "./structures/commands/Command.js";
export type {
  CommandLoaderContext,
  CommandOptions,
  CommandRun,
} from "./structures/commands/type.js";
export type { CommandContext } from "./structures/commands/Context.js";
export { CommandCTX } from "./structures/commands/Context.js";
export * from "./structures/commands/utils.js";
export * from "./structures/commands/args.js";
export { default as CommandRegisterer } from "./structures/commands/Registerer.js";

export { CommandPipeline, type PipelineCtx } from "./structures/pipeline/Pipeline.js";

export * from "./structures/eventbus/Event.js";
export * from "./structures/eventbus/EventBus.js";
export { EventRegisterer } from "./structures/eventbus/Registerer.js";

export {
  Logger,
  LogLevel,
  createLogger,
  defaultLogger,
} from "./structures/library/Logger.js";
export type { LoggerOptions } from "./structures/library/Logger.js";

export { Module, type ModuleContext } from "./structures/module/Module.js";
export { CoreModule } from "./structures/module/CoreModule.js";
export { ModuleRegisterer } from "./structures/module/Registerer.js";

export * from "./structures/utils/del.js";