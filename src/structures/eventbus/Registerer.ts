import { EventBus } from "./EventBus";
import { EventHandler } from "./Event";

export class EventRegisterer {
  private _handlers: EventHandler[] = [];
  private _unsubs = new Map<EventHandler, () => void>();

  constructor(private _bus: EventBus<any>) {}

  public register(handlers: EventHandler | EventHandler[]) {
    const arr = Array.isArray(handlers) ? handlers : [handlers];
    for (const handler of arr) {
      this._handlers.push(handler);
      const unsub = this._bus.on(
        handler.options.event,
        (ctx) => handler.run(ctx),
        {
          priority: handler.options.priority,
          once: handler.options.once,
        },
      );
      this._unsubs.set(handler, unsub);
    }
  }

  public unregister(handler: EventHandler) {
    this._unsubs.get(handler)?.();
    this._unsubs.delete(handler);
    this._handlers = this._handlers.filter((h) => h !== handler);
  }

  public listHandlers() {
    return this._handlers;
  }

  get bus() {
    return this._bus;
  }
}
