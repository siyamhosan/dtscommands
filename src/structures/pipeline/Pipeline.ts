type StageFn<TCtx extends object, TAdd extends object> = (
  ctx: TCtx,
) => Promise<TAdd | false>;

type StageOnFail<TCtx extends object> = (ctx: TCtx) => void | Promise<void>;

interface InternalStage {
  name: string;
  run: (ctx: object) => Promise<object | false>;
  onFail?: (ctx: object) => void | Promise<void>;
}

/**
 * A typesafe sequential validation pipeline.
 *
 * Each stage either returns data to merge into context, or `false` to stop.
 * Context accumulates across stages — later stages receive all previous additions.
 *
 * Commands declare which stage they need via `runUntil(stage, ctx)`.
 * The returned context is fully typed up to that stage.
 *
 * @example
 * const pipeline = CommandPipeline.create<CommandCTX>()
 *   .addStage("guild", async (ctx) => {
 *     if (!ctx.guild) { await ctx.reply({ content: "Guild only!" }); return false; }
 *     return { guild: ctx.guild };
 *   })
 *   .addStage("voice", async (ctx) => {
 *     // ctx has guild here
 *     const vc = ctx.member?.voice?.channel;
 *     if (!vc) { await ctx.reply({ content: "Join a voice channel!" }); return false; }
 *     return { voiceChannel: vc };
 *   });
 *
 * // In command handler:
 * const pipeCtx = await pipeline.runUntil("voice", ctx);
 * if (!pipeCtx) return; // already replied, just stop
 * // pipeCtx.guild and pipeCtx.voiceChannel are fully typed
 */
export class CommandPipeline<
  TBase extends object,
  TAccum extends object = object,
  TRegistry extends Record<string, object> = Record<never, never>,
> {
  private constructor(private readonly _stages: InternalStage[]) {}

  static create<TBase extends object>() {
    return new CommandPipeline<TBase, object, Record<never, never>>([]);
  }

  /**
   * Adds a new stage to the pipeline.
   *
   * @param name    - Unique stage name used to reference it in `runUntil`.
   * @param run     - Handler that receives accumulated context. Return data to merge, or `false` to stop.
   * @param onFail  - Optional side-effect after a `false` return (e.g. logging). The `run` fn is responsible for replying.
   */
  addStage<TName extends string, TAdd extends object>(
    name: TName,
    run: StageFn<TBase & TAccum, TAdd>,
    onFail?: StageOnFail<TBase & TAccum>,
  ): CommandPipeline<
    TBase,
    TAccum & TAdd,
    TRegistry & Record<TName, TBase & TAccum & TAdd>
  > {
    return new CommandPipeline([
      ...this._stages,
      {
        name,
        run: run as InternalStage["run"],
        onFail: onFail as InternalStage["onFail"],
      },
    ]);
  }

  /**
   * Runs stages in order up to and including `stage`.
   * Returns the accumulated context (typed for that stage) or `null` if any stage failed.
   *
   * Uses Object.create(base) so the returned object inherits all prototype methods
   * from the base (e.g. CommandCTX.reply, CommandCTX.guild, etc.) while own
   * properties from each stage are layered on top via Object.assign.
   */
  async runUntil<TName extends keyof TRegistry & string>(
    stage: TName,
    base: TBase,
  ): Promise<TRegistry[TName] | null> {
    let enrichment: object = {};
    for (const s of this._stages) {
      const stageCtx = Object.assign(Object.create(base as object), enrichment);
      const result = await s.run(stageCtx);
      if (result === false) {
        await s.onFail?.(stageCtx);
        return null;
      }
      enrichment = { ...enrichment, ...(result as object) };
      if (s.name === stage) break;
    }
    return Object.assign(
      Object.create(base as object),
      enrichment,
    ) as TRegistry[TName];
  }

  /**
   * Runs the full pipeline.
   * Returns the fully accumulated context or `null` if any stage failed.
   */
  async run(base: TBase): Promise<(TBase & TAccum) | null> {
    let enrichment: object = {};
    for (const s of this._stages) {
      const stageCtx = Object.assign(Object.create(base as object), enrichment);
      const result = await s.run(stageCtx);
      if (result === false) {
        await s.onFail?.(stageCtx);
        return null;
      }
      enrichment = { ...enrichment, ...(result as object) };
    }
    return Object.assign(Object.create(base as object), enrichment) as TBase &
      TAccum;
  }

  /** All registered stage names in order. */
  get stageNames(): string[] {
    return this._stages.map((s) => s.name);
  }
}

/**
 * Extracts the fully accumulated context type at a given named stage.
 *
 * @example
 * type VoiceCtx = PipelineCtx<typeof musicPipeline, "voice">;
 * // → CommandCTX & { guild: Guild } & { voiceChannel: VoiceBasedChannel }
 */
export type PipelineCtx<P, TName extends string> =
  P extends CommandPipeline<infer _Base, infer _Accum, infer Registry>
    ? TName extends keyof Registry
      ? Registry[TName]
      : never
    : never;
