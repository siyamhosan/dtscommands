import { EventContext } from "./EventBus";

export interface EventHandlerOptions {
  event: string;
  name?: string;
  priority?: number;
  once?: boolean;
}

export abstract class EventHandler<TPayload = any> {
  public options: EventHandlerOptions;

  constructor(options: EventHandlerOptions) {
    this.options = options;
  }

  public abstract run(ctx: EventContext<TPayload>): void | Promise<void>;
}
