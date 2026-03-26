import CommandRegisterer from "../commands/Registerer";
import { EventBus } from "../eventbus/EventBus";
import { EventRegisterer } from "../eventbus/Registerer";
import Bot from "../library/Client";
import { CoreModule } from "./CoreModule";
import { Module, ModuleContext } from "./Module";

export class ModuleRegisterer {
  private _modules = new Map<string, Module>();
  private _services = new Map<string, unknown>();

  constructor(
    public client: Bot,
    public eventBus: EventBus<any>,
    public commandRegisterer: CommandRegisterer,
    public eventRegisterer: EventRegisterer,
  ) {
    this.register(new CoreModule(client, eventBus, commandRegisterer));
  }

  /**
   * Register one or more modules.
   *
   * Order per module:
   *  1. Store declared services (so imported modules' services are available)
   *  2. Call onInit (module can create pipelines, set commands/events dynamically)
   *  3. Wire commands to CommandRegisterer
   *  4. Wire events to EventRegisterer
   */
  async register(modules: Module | Module[]): Promise<void> {
    const arr = Array.isArray(modules) ? modules : [modules];
    const sorted = this._topologicalSort(arr);

    for (const mod of sorted) {
      if (this._modules.has(mod.name)) continue;

      if (mod.services) {
        for (const [name, service] of Object.entries(mod.services)) {
          this._services.set(name, service);
        }
      }

      if (mod.onInit) {
        await mod.onInit(this._createContext());
      }

      if (mod.commands?.length) {
        this.commandRegisterer.register(mod.commands);
      }

      if (mod.events?.length) {
        this.eventRegisterer.register(mod.events);
      }

      this._modules.set(mod.name, mod);
    }
  }

  async unregister(moduleName: string): Promise<void> {
    const mod = this._modules.get(moduleName);
    if (!mod) return;

    if (mod.onDestroy) {
      await mod.onDestroy();
    }

    if (mod.events) {
      for (const handler of mod.events) {
        this.eventRegisterer.unregister(handler);
      }
    }

    if (mod.commands) {
      for (const command of mod.commands) {
        this.commandRegisterer.unregisterCommand(command);
      }
    }

    if (mod.services) {
      for (const name of Object.keys(mod.services)) {
        this._services.delete(name);
      }
    }

    this._modules.delete(moduleName);
  }

  getService<T>(name: string): T {
    return this._services.get(name) as T;
  }

  hasService(name: string): boolean {
    return this._services.has(name);
  }

  listModules(): Module[] {
    return [...this._modules.values()];
  }

  private _createContext(): ModuleContext {
    return {
      getService: <T>(name: string) => this._services.get(name) as T,
      hasService: (name: string) => this._services.has(name),
    };
  }

  private _topologicalSort(modules: Module[]): Module[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: Module[] = [];
    const moduleMap = new Map<string, Module>();

    const collect = (mod: Module) => {
      if (moduleMap.has(mod.name)) return;
      moduleMap.set(mod.name, mod);
      if (mod.imports) {
        for (const dep of mod.imports) {
          collect(dep);
        }
      }
    };

    for (const mod of modules) collect(mod);

    const visit = (mod: Module) => {
      if (visited.has(mod.name)) return;
      if (visiting.has(mod.name)) {
        throw new Error(
          `ModuleRegisterer: circular dependency detected at "${mod.name}"`,
        );
      }
      visiting.add(mod.name);
      if (mod.imports) {
        for (const dep of mod.imports) {
          visit(dep);
        }
      }
      visiting.delete(mod.name);
      visited.add(mod.name);
      sorted.push(mod);
    };

    for (const mod of moduleMap.values()) visit(mod);

    return sorted;
  }
}
