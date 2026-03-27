import { PermissionResolvable } from "discord.js";
import { CooldownConfigOptions } from "../base/Cooldown";
import Bot from "../library/Client";
import { CommandPipeline, PipelineCtx } from "../pipeline/Pipeline";
import { CommandCTX } from "./Context";
import { ArgBuilder, ResolvedArgs } from "./args";

export interface CommandLoaderContext {
  // client: Bot;
}

export interface CommandOptions<
  PipeLine extends CommandPipeline<any, any, any> = CommandPipeline<
    any,
    any,
    any
  >,
> {
  name?: string;
  category?: string;
  description?: string;
  usage?: string;
  aliases?: string[];
  isOwnerOnly?: boolean;
  isInBeta?: boolean;
  isBotAllowed?: boolean;
  isGuildOnly?: boolean;
  commandArgs?: ArgBuilder[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  commandCooldown?: CooldownConfigOptions;

  isPrefixCommand?: boolean;

  pipeLine?: PipeLine;
  pipeLineUntil?: string;

  // data?: SlashCommandBuilder | undefined
}

export interface CommandRun<
  PipeLine extends CommandPipeline<any, any, any> = CommandPipeline<
    any,
    any,
    any
  >,
  PipeLineUntil extends string = string,
> {
  ctx: CommandCTX;
  args: ResolvedArgs;
  client: Bot;
  ptx?: PipelineCtx<PipeLine, PipeLineUntil>;
}
// TODO:     subCommand?: string | undefined
