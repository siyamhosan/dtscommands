import { ClientEvents } from "discord.js";

/**
 * All Discord.js client events, mapped automatically from `ClientEvents`.
 *
 * Extend this with `&` or interface extension to add your own internal events.
 * Never needs manual updates — stays in sync with discord.js.
 *
 * @example
 * interface BotEvents extends DiscordEvents {
 *   trackStart: { track: Track; guildId: string };
 *   trackEnd:   { track: Track; reason: string };
 * }
 *
 * const bus = EventBus.create<BotEvents>();
 *
 * // discord events — payload is the original args tuple
 * bus.on("messageCreate", (ctx) => {
 *   const [message] = ctx.payload;
 * });
 *
 * // custom events — payload is your object
 * bus.on("trackStart", (ctx) => {
 *   ctx.payload.track;
 * });
 */
export interface DiscordEvents extends ClientEvents {}

type ListenerFn<T> = (ctx: EventContext<T>) => void | Promise<void>;

interface ListenerEntry {
  event: string;
  fn: ListenerFn<any>;
  priority: number;
  once: boolean;
  id: string;
}

export interface EventContext<T> {
  readonly event: string;
  readonly payload: Readonly<T>;
  readonly timestamp: number;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  stop(): void;
}

export interface EventTrace {
  readonly event: string;
  readonly correlationId: string;
  readonly source?: string;
  readonly timestamp: number;
  readonly listeners: readonly ListenerTrace[];
  readonly duration: number;
}

export interface ListenerTrace {
  readonly id: string;
  readonly duration: number;
  readonly error?: Error;
}

export interface EmitOptions {
  correlationId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
  mode?: "sequential" | "parallel";
}

/**
 * A typed event bus for decoupled module communication.
 *
 * Modules publish events. Other modules react.
 * Publisher does not know listeners. This prevents feature collisions.
 *
 * Supports priority ordering, sequential/parallel execution,
 * correlation IDs for tracing, and optional trace recording for debugging.
 *
 * @example
 * interface BotEvents {
 *   trackStart: { track: Track; guildId: string };
 *   trackEnd:   { track: Track; reason: string };
 *   queueUpdated: { guildId: string };
 * }
 *
 * const bus = EventBus.create<BotEvents>({ tracing: true });
 *
 * // subscribe — returns an unsubscribe function
 * const unsub = bus.on("trackStart", async (ctx) => {
 *   console.log(ctx.payload.track);
 * });
 *
 * // emit
 * await bus.emit("trackStart", { track, guildId }, {
 *   source: "PlayerService",
 *   correlationId: commandCorrelationId,
 * });
 *
 * // testing — wait for an event
 * const ctx = await bus.waitFor("trackEnd", { timeout: 5000 });
 */
export class EventBus<
  TEvents extends Record<string, any> = Record<string, any>,
> {
  private _listeners = new Map<string, ListenerEntry[]>();
  private _traces: EventTrace[] = [];
  private _tracing: boolean;
  private _maxTraces: number;
  private _counter = 0;

  private constructor(tracing: boolean, maxTraces: number) {
    this._tracing = tracing;
    this._maxTraces = maxTraces;
  }

  static create<T extends Record<string, any> = Record<string, any>>(options?: {
    tracing?: boolean;
    maxTraces?: number;
  }) {
    return new EventBus<T>(
      options?.tracing ?? false,
      options?.maxTraces ?? 500,
    );
  }

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   *
   * Listeners run in priority order (lower number = runs first).
   * Default priority is 100.
   */
  on<K extends keyof TEvents & string>(
    event: K,
    fn: ListenerFn<TEvents[K]>,
    options?: { priority?: number; once?: boolean },
  ): () => void {
    const entry: ListenerEntry = {
      event,
      fn,
      priority: options?.priority ?? 100,
      once: options?.once ?? false,
      id: `${event}:${++this._counter}`,
    };

    const list = this._listeners.get(event) ?? [];
    list.push(entry);
    list.sort((a, b) => a.priority - b.priority);
    this._listeners.set(event, list);

    return () => {
      const current = this._listeners.get(event);
      if (!current) return;
      const filtered = current.filter((l) => l.id !== entry.id);
      if (filtered.length) this._listeners.set(event, filtered);
      else this._listeners.delete(event);
    };
  }

  /** Subscribe to an event. Listener fires once then auto-removes. */
  once<K extends keyof TEvents & string>(
    event: K,
    fn: ListenerFn<TEvents[K]>,
    options?: { priority?: number },
  ): () => void {
    return this.on(event, fn, { ...options, once: true });
  }

  /** Remove all listeners for a specific event. */
  off<K extends keyof TEvents & string>(event: K): void {
    this._listeners.delete(event);
  }

  /**
   * Emit an event.
   *
   * Sequential mode (default): listeners run in priority order.
   * A listener can call `ctx.stop()` to halt remaining listeners.
   *
   * Parallel mode: all listeners run concurrently.
   * Errors in individual listeners never crash the bus.
   */
  async emit<K extends keyof TEvents & string>(
    event: K,
    payload: TEvents[K],
    options?: EmitOptions,
  ): Promise<void> {
    const list = this._listeners.get(event);
    if (!list?.length) return;

    const correlationId =
      options?.correlationId ?? this._generateCorrelationId();
    const timestamp = Date.now();
    let stopped = false;

    const ctx: EventContext<TEvents[K]> = {
      event,
      payload: Object.freeze({ ...payload }) as Readonly<TEvents[K]>,
      timestamp,
      correlationId,
      metadata: Object.freeze({
        ...options?.metadata,
      }) as Readonly<Record<string, unknown>>,
      stop() {
        stopped = true;
      },
    };

    const listenerTraces: ListenerTrace[] = [];
    const toRemove: string[] = [];
    const startTime = Date.now();
    const mode = options?.mode ?? "sequential";

    if (mode === "sequential") {
      for (const entry of [...list]) {
        if (stopped) break;
        const lStart = Date.now();
        let error: Error | undefined;
        try {
          await entry.fn(ctx);
        } catch (err) {
          error = err as Error;
        }
        if (this._tracing) {
          listenerTraces.push({
            id: entry.id,
            duration: Date.now() - lStart,
            ...(error && { error }),
          });
        }
        if (entry.once) toRemove.push(entry.id);
      }
    } else {
      const tasks = [...list].map(async (entry) => {
        const lStart = Date.now();
        let error: Error | undefined;
        try {
          await entry.fn(ctx);
        } catch (err) {
          error = err as Error;
        }
        if (this._tracing) {
          listenerTraces.push({
            id: entry.id,
            duration: Date.now() - lStart,
            ...(error && { error }),
          });
        }
        if (entry.once) toRemove.push(entry.id);
      });
      await Promise.all(tasks);
    }

    if (toRemove.length) {
      const current = this._listeners.get(event);
      if (current) {
        const filtered = current.filter((l) => !toRemove.includes(l.id));
        if (filtered.length) this._listeners.set(event, filtered);
        else this._listeners.delete(event);
      }
    }

    if (this._tracing) {
      this._traces.push({
        event,
        correlationId,
        source: options?.source,
        timestamp,
        listeners: listenerTraces,
        duration: Date.now() - startTime,
      });
      if (this._traces.length > this._maxTraces) {
        this._traces = this._traces.slice(-this._maxTraces);
      }
    }
  }

  /**
   * Wait for an event to fire. Returns a promise that resolves with the event context.
   * Useful for testing and async coordination flows.
   *
   * Pass `timeout: 0` to wait indefinitely.
   */
  waitFor<K extends keyof TEvents & string>(
    event: K,
    options?: {
      timeout?: number;
      filter?: (payload: Readonly<TEvents[K]>) => boolean;
    },
  ): Promise<EventContext<TEvents[K]>> {
    return new Promise((resolve, reject) => {
      const timeout = options?.timeout ?? 10_000;
      let settled = false;

      let timer: ReturnType<typeof setTimeout> | undefined;
      if (timeout > 0) {
        timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          unsub();
          reject(
            new Error(
              `EventBus: waitFor("${event}") timed out after ${timeout}ms`,
            ),
          );
        }, timeout);
      }

      const unsub = this.on(event, (ctx) => {
        if (settled) return;
        if (options?.filter && !options.filter(ctx.payload)) return;
        settled = true;
        if (timer) clearTimeout(timer);
        unsub();
        resolve(ctx);
      });
    });
  }

  /** All recorded event traces (only populated when tracing is enabled). */
  get traces(): readonly EventTrace[] {
    return this._traces;
  }

  /** Get all traces sharing a correlation ID. */
  tracesByCorrelation(correlationId: string): EventTrace[] {
    return this._traces.filter((t) => t.correlationId === correlationId);
  }

  /** Clear all stored traces. */
  clearTraces(): void {
    this._traces = [];
  }

  /** Number of listeners for a given event. */
  listenerCount<K extends keyof TEvents & string>(event: K): number {
    return this._listeners.get(event)?.length ?? 0;
  }

  /** All event names that have active listeners. */
  get eventNames(): string[] {
    return [...this._listeners.keys()];
  }

  /** Remove all listeners and traces. */
  clear(): void {
    this._listeners.clear();
    this._traces = [];
    this._counter = 0;
  }

  /** Enable or disable tracing at runtime. */
  set tracing(enabled: boolean) {
    this._tracing = enabled;
  }

  get tracing(): boolean {
    return this._tracing;
  }

  private _generateCorrelationId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

/**
 * Extracts the payload type for a given event name from an EventBus instance.
 *
 * @example
 * type TrackPayload = EventPayload<typeof bus, "trackStart">;
 */
export type EventPayload<TBus, TEvent extends string> =
  TBus extends EventBus<infer TEvents>
    ? TEvent extends keyof TEvents
      ? TEvents[TEvent]
      : never
    : never;
