import { Command } from "../commands/Command";
import { EventHandler } from "../eventbus/Event";

export interface ModuleContext {
  getService<T>(name: string): T;
  hasService(name: string): boolean;
}

export abstract class Module {
  abstract name: string;

  imports?: Module[];
  commands?: Command[];
  events?: EventHandler[];
  services?: Record<string, unknown>;

  onInit?(ctx: ModuleContext): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
