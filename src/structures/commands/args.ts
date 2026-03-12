import {
  Attachment,
  ChannelType,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
  Role,
  SlashCommandBuilder,
  TextBasedChannel,
  User,
} from "discord.js";
import Bot from "../library/Client";
import { Command } from "./Command";
import { CommandContext } from "./Context";

export type ArgType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "user"
  | "member"
  | "channel"
  | "role"
  | "attachment";

export interface SlashChoice {
  name: string;
  value: string | number;
}

interface ArgDefinition {
  name: string;
  description: string;
  type: ArgType;
  required: boolean;
  // Apply to all types
  choices?: SlashChoice[];
  // Apply to string type
  minLength?: number;
  // Apply to string type
  maxLength?: number;
  // Apply to integer and number types
  minValue?: number;
  // Apply to integer and number types
  maxValue?: number;
  // Apply to channel type
  channelTypes?: Array<
    | ChannelType.GuildText
    | ChannelType.GuildVoice
    | ChannelType.GuildCategory
    | ChannelType.GuildAnnouncement
    | ChannelType.AnnouncementThread
    | ChannelType.PublicThread
    | ChannelType.PrivateThread
    | ChannelType.GuildStageVoice
    | ChannelType.GuildForum
    | ChannelType.GuildMedia
    | ChannelType.DM
    | ChannelType.GroupDM
    | ChannelType.GuildDirectory
  >;
  // Apply to all types
  test?: (value: unknown, ctx: CommandContext) => boolean | Promise<boolean>;
  // Apply to all types tested after converted to string
  pattern?: RegExp;
  // Apply to all types
  default?: unknown;
  usageLabel?: string;
  autocomplete?: boolean;
}

export type ParsedArgValue =
  | string
  | number
  | boolean
  | User
  | GuildMember
  | TextBasedChannel
  | Role
  | Attachment
  | undefined;

export type ParsedArgs = Record<string, ParsedArgValue>;

export class ArgBuilder {
  private def: ArgDefinition;

  constructor(def: ArgDefinition, type: ArgType) {
    this.def = {
      ...def,
      type,
      required: true,
    };
  }

  setName(name: string) {
    this.def.name = name;
    return this;
  }

  setDescription(description: string) {
    this.def.description = description;
    return this;
  }

  isRequired(required = true) {
    this.def.required = required;
    return this;
  }

  setUsageLabel(label: string) {
    this.def.usageLabel = label;
    return this;
  }

  setDefault(value: unknown) {
    this.def.default = value;
    return this;
  }

  setPattern(pattern: RegExp) {
    this.def.pattern = pattern;
    return this;
  }

  setTest(
    fn: (value: unknown, ctx: CommandContext) => boolean | Promise<boolean>,
  ) {
    this.def.test = fn;
    return this;
  }

  addChoices(...choices: SlashChoice[]) {
    this.def.choices = choices;
    return this;
  }

  setMinLength(n: number) {
    this.def.minLength = n;
    return this;
  }

  setMaxLength(n: number) {
    this.def.maxLength = n;
    return this;
  }

  setMinValue(n: number) {
    this.def.minValue = n;
    return this;
  }

  setMaxValue(n: number) {
    this.def.maxValue = n;
    return this;
  }

  setChannelTypes(...types: NonNullable<ArgDefinition["channelTypes"]>) {
    this.def.channelTypes = types;
    return this;
  }

  setAutocomplete(autocomplete = true) {
    this.def.autocomplete = autocomplete;
    return this;
  }

  applyOptions(builder: SlashCommandBuilder): SlashCommandBuilder {
    switch (this.def.type) {
      case "string": {
        builder.addStringOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          if (this.def.minLength) option.setMinLength(this.def.minLength);
          if (this.def.maxLength) option.setMaxLength(this.def.maxLength);

          return option;
        });
      }

      case "integer": {
        builder.addIntegerOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          if (this.def.minValue) option.setMinValue(this.def.minValue);
          if (this.def.maxValue) option.setMaxValue(this.def.maxValue);

          return option;
        });
      }
      case "number": {
        builder.addNumberOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          if (this.def.minValue) option.setMinValue(this.def.minValue);
          if (this.def.maxValue) option.setMaxValue(this.def.maxValue);
          return option;
        });
      }
      case "boolean": {
        builder.addBooleanOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      case "user": {
        builder.addUserOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      case "member": {
        builder.addUserOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      case "channel": {
        builder.addChannelOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      case "role": {
        builder.addRoleOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      case "attachment": {
        builder.addAttachmentOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }

      default: {
        builder.addStringOption((option) => {
          option
            .setName(this.def.name)
            .setDescription(this.def.description)
            .setRequired(this.def.required);
          return option;
        });
      }
    }

    return builder;
  }

  toJson(): ArgDefinition {
    return this.def;
  }
}

export class ResolvedArgs {
  constructor(private readonly args: ParsedArgs) {}

  get(name: string): ParsedArgValue {
    return this.args[name];
  }

  getString(name: string): string {
    return this.args[name] as string;
  }

  getInteger(name: string): number {
    return this.args[name] as number;
  }

  getNumber(name: string): number {
    return this.args[name] as number;
  }

  getBoolean(name: string): boolean {
    return this.args[name] as boolean;
  }

  getUser(name: string): User {
    return this.args[name] as User;
  }

  getMember(name: string): GuildMember {
    return this.args[name] as GuildMember;
  }

  getChannel(name: string): TextBasedChannel {
    return this.args[name] as TextBasedChannel;
  }

  getRole(name: string): Role {
    return this.args[name] as Role;
  }

  getMentionable(name: string): User | GuildMember | Role {
    return this.args[name] as User | GuildMember | Role;
  }
}

export async function ChatCommandInteractionArgsResolver(
  client: Bot,
  interaction: ChatInputCommandInteraction,
  command: Command,
) {
  const args = command.options.commandArgs;
  if (!args) return new ResolvedArgs({});

  const resolvedArgs: ParsedArgs = {};

  for (const arg of args) {
    const argDef = arg.toJson();
    let argValue = interaction.options.get(argDef.name, argDef.required)?.value;

    if (argDef.default && !argValue) {
      argValue = argDef.default as string | number | boolean;
    }

    // Validation Stage

    if (argDef.test && argValue) {
      const result = await argDef.test(argValue, interaction);
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    if (argDef.pattern && argValue) {
      const result = argDef.pattern.test(String(argValue));
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    if (argDef.choices && argValue) {
      const result = argDef.choices.find((choice) => choice.value === argValue);
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    switch (argDef.type) {
      case "string": {
        const value = String(argValue);
        if (argDef.minLength && value.length < argDef.minLength) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        }
        if (argDef.maxLength && value.length > argDef.maxLength) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        }
        if (argDef.pattern && !argDef.pattern.test(value)) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        }
        break;
      }
      case "integer":
      case "number": {
        const value = Number(argValue);
        if (argDef.minValue && value < argDef.minValue) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        }
        if (argDef.maxValue && value > argDef.maxValue) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        }
        break;
      }
      case "channel": {
        const value = interaction.options.getChannel(
          argDef.name,
          argDef.required,
        );
        if (!value && argDef.required) {
          throw new Error(`Invalid argument: ${argDef.name}`);
        } else if (value && argDef.channelTypes) {
          if (!argDef.channelTypes.includes(value.type)) {
            throw new Error(`Invalid argument: ${argDef.name}`);
          }
        }
        break;
      }
    }

    // Convert & Return Stage
    switch (argDef.type) {
      case "string": {
        resolvedArgs[argDef.name] = String(argValue);
        break;
      }
      case "integer":
      case "number": {
        resolvedArgs[argDef.name] = Number(argValue);
        break;
      }
      case "channel": {
        resolvedArgs[argDef.name] = interaction.options.getChannel(
          argDef.name,
          argDef.required,
        ) as TextBasedChannel;
        break;
      }
      case "role": {
        resolvedArgs[argDef.name] = interaction.options.getRole(
          argDef.name,
          argDef.required,
        ) as Role;
        break;
      }
      case "user": {
        resolvedArgs[argDef.name] = interaction.options.getUser(
          argDef.name,
          argDef.required,
        ) as User;
        break;
      }
      case "member": {
        resolvedArgs[argDef.name] = interaction.options.getMember(
          argDef.name,
        ) as GuildMember;
        break;
      }
      case "attachment": {
        resolvedArgs[argDef.name] = interaction.options.getAttachment(
          argDef.name,
          argDef.required,
        ) as Attachment;
        break;
      }
    }
  }

  return new ResolvedArgs(resolvedArgs);
}

export async function PrefixCommandInteractionArgsResolver(
  client: Bot,
  message: Message,
  command: Command,
) {
  const args = command.options.commandArgs;
  if (!args) return new ResolvedArgs({});

  const resolvedArgs: ParsedArgs = {};

  args.forEach(async (arg, index) => {
    const argDef = arg.toJson();
    let argValue = message.content.split(/ +/)[index];
    if (!argValue) {
      argValue = argDef.default as string | undefined;
    }

    if (argDef.test && argValue) {
      const result = await argDef.test(argValue, {
        client,
        message,
      });
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    if (argDef.pattern && argValue) {
      const result = argDef.pattern.test(String(argValue));
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    if (argDef.choices && argValue) {
      const result = argDef.choices.find((choice) => choice.value === argValue);
      if (!result) {
        throw new Error(`Invalid argument: ${argDef.name}`);
      }
    }

    switch (argDef.type) {
      case "string": {
        resolvedArgs[argDef.name] = String(argValue);
        break;
      }
      case "integer":
      case "number": {
        resolvedArgs[argDef.name] = Number(argValue);
        break;
      }
    }
  });

  return new ResolvedArgs(resolvedArgs);
}
