import {
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Message,
  MessageFlags,
  PermissionsBitField,
} from "discord.js";
import { CooldownValidator } from "../base/Cooldown";
import Bot from "../library/Client";
import { CommandPipeline, PipelineCtx } from "../pipeline/Pipeline";
import { parseArgsFromMessage } from "../utils/prefix";
import { Command } from "./Command";
import { CommandCTX } from "./Context";
import {
  ChatCommandInteractionArgsResolver,
  PrefixCommandInteractionArgsResolver
} from "./args";

class CommandRegisterer {
  private commands: Command[] = [];

  constructor() {}

  public register(commands: Command | Command[]) {
    if (commands instanceof Command) {
      this.commands.push(commands);
    } else if (Array.isArray(commands)) {
      commands.forEach((command) => {
        this.commands.push(command);
      });
    }
  }

  public unregisterCommand(command: Command) {
    this.commands = this.commands.filter((c) => c !== command);
  }

  public listCommands() {
    return this.commands;
  }

  // Handle Slash Commands
  public async handleApplicationCommandInteraction(
    interaction: ChatInputCommandInteraction,
    client: Bot,
  ) {
    const command = this.commands.find(
      (c) => c.slashCommand?.name === interaction.commandName,
    );
    if (!command) {
      return interaction.reply({
        content: "This command is outdated.",
        ephemeral: true,
      });
    }

    const {
      isOwnerOnly,
      isInBeta,
      isGuildOnly,
      userPermissions,
      botPermissions,
    } = command.options;

    if ((isGuildOnly || client.config.guildOnly) && !interaction.guild) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (botPermissions) {
      if (
        !interaction.guild?.members.me?.permissions.has(
          PermissionsBitField.resolve(botPermissions || []),
        )
      ) {
        const msg = `I don't have **\`${botPermissions.join(", ")}\`** permission in ${interaction.channel?.toString()} to execute this **\`${interaction.commandName}\`** command.`;

        const fixPermissionsButton = new ButtonBuilder()
          .setLabel("Fix Permissions")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&scope=bot%20applications.commands&permissions=382185367609&guild_id=${interaction.guild?.id}&disable_guild_select=true`,
          );

        try {
          await interaction.reply({
            content: msg,
            components: [
              // @ts-ignore
              new ActionRowBuilder().addComponents(fixPermissionsButton),
            ],
          });
        } catch {
          await interaction.reply({
            content: msg,
            flags: [MessageFlags.Ephemeral],
          });
        } finally {
          return;
        }
      }
    }

    if (userPermissions) {
      const memberPermissions = interaction.member?.permissions;
      if (
        typeof memberPermissions !== "string" &&
        !memberPermissions?.has(PermissionsBitField.resolve(userPermissions))
      ) {
        const msg = `You don't have **\`${userPermissions.join(", ")}\`** permission in ${interaction.channel?.toString()} to execute this **\`${interaction.commandName}\`** command.`;

        const fixPermissionsButton = new ButtonBuilder()
          .setLabel("Fix Permissions")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&scope=bot%20applications.commands&permissions=382185367609&guild_id=${interaction.guild?.id}&disable_guild_select=true`,
          );
        try {
          await interaction.reply({
            content: msg,
            components: [
              // @ts-ignore
              new ActionRowBuilder().addComponents(fixPermissionsButton),
            ],
          });
        } catch {
          await interaction.reply({
            content: msg,
            flags: [MessageFlags.Ephemeral],
          });
        } finally {
          return;
        }
      }
    }

    if (isOwnerOnly && !client.config.owners?.includes(interaction.user.id)) {
      return interaction.reply({
        content: "This command can only be used by the owner.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    if (isInBeta && !client.config.beteTesters?.includes(interaction.user.id)) {
      return interaction.reply({
        content: "This command is in beta testing.",
        flags: [MessageFlags.Ephemeral],
      });
    }

    const isBlockedByCooldown = await CooldownValidator(
      interaction,
      client,
      command,
    );
    if (isBlockedByCooldown) return true;

    let ptx: PipelineCtx<CommandPipeline<Command, any, any>, any>;

    if (command.options.pipeLine) {
      ptx = await command.options.pipeLine.runUntil(
        command.options.pipeLineUntil as string,
        interaction,
      );
      if (!ptx) return;
    }

    const ctx = new CommandCTX({
      client,
      interaction,
    });

    try {
      const resolvedArgs = await ChatCommandInteractionArgsResolver(
        client,
        interaction,
        command,
      );

      await command.run({
        ctx,
        ptx,
        client,
        args: resolvedArgs,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "There was an error trying to execute that command!",
        flags: [MessageFlags.Ephemeral],
      });
    }
  }

  public async handlePrefixCommandInteraction(message: Message, client: Bot) {
    const { prefix, commandName, args } = await parseArgsFromMessage(client, message);
    if (commandName === "") {
      return;
    }

    const command = this.commands.find(
      (c) =>
        c.options.name === commandName ||
        c.options.aliases?.includes(commandName),
    );
    if (!command) {
      const repliedMessage = await message.reply({
        content: "This command is outdated.",
      });

      setTimeout(() => {
        repliedMessage.delete();
      }, 5000);

      return;
    }

    const {
      isOwnerOnly,
      isInBeta,
      isGuildOnly,
      userPermissions,
      botPermissions,
    } = command.options;

    if ((isGuildOnly || client.config.guildOnly) && !message.guild) {
      const repliedMessage = await message.reply({
        content: "This command can only be used in a server.",
      });
      setTimeout(() => {
        repliedMessage.delete();
      }, 5000);
      return;
    }

    if (botPermissions) {
      if (
        !message.guild?.members.me?.permissions.has(
          PermissionsBitField.resolve(botPermissions || []),
        )
      ) {
        const msg = `I don't have **\`${botPermissions.join(", ")}\`** permission in ${message.channel?.toString()} to execute this **\`${commandName}\`** command.`;

        const fixPermissionsButton = new ButtonBuilder()
          .setLabel("Fix Permissions")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot%20applications.commands&permissions=382185367609&guild_id=${message.guild?.id}&disable_guild_select=true`,
          );

        try {
          const repliedMessage = await message.reply({
            content: msg,
            components: [
              // @ts-ignore
              new ActionRowBuilder().addComponents(fixPermissionsButton),
            ],
          });

          setTimeout(() => {
            repliedMessage.delete();
          }, 5000);

          return;
        } catch {
          const repliedMessage = await message.reply({
            content: msg,
          });

          setTimeout(() => {
            repliedMessage.delete();
          }, 5000);

          return;
        } finally {
          return;
        }
      }
    }

    if (userPermissions) {
      const memberPermissions = message.member?.permissions;
      if (
        typeof memberPermissions !== "string" &&
        !memberPermissions?.has(PermissionsBitField.resolve(userPermissions))
      ) {
        const msg = `You don't have **\`${userPermissions.join(", ")}\`** permission in ${message.channel?.toString()} to execute this **\`${commandName}\`** command.`;

        const fixPermissionsButton = new ButtonBuilder()
          .setLabel("Fix Permissions")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/oauth2/authorize?client_id=${message.client.user.id}&scope=bot%20applications.commands&permissions=382185367609&guild_id=${message.guild?.id}&disable_guild_select=true`,
          );
        try {
          const repliedMessage = await message.reply({
            content: msg,
            components: [
              // @ts-ignore
              new ActionRowBuilder().addComponents(fixPermissionsButton),
            ],
          });

          setTimeout(() => {
            repliedMessage.delete();
          }, 5000);

          return;
        } catch {
          const repliedMessage = await message.reply({
            content: msg,
          });

          setTimeout(() => {
            repliedMessage.delete();
          }, 5000);

          return;
        } finally {
          return;
        }
      }
    }

    if (isOwnerOnly && !client.config.owners?.includes(message.author.id)) {
      const repliedMessage = await message.reply({
        content: "This command can only be used by the owner.",
      });
      setTimeout(() => {
        repliedMessage.delete();
      }, 5000);
      return;
    }

    if (isInBeta && !client.config.beteTesters?.includes(message.author.id)) {
      const repliedMessage = await message.reply({
        content: "This command is in beta testing.",
      });
      setTimeout(() => {
        repliedMessage.delete();
      }, 5000);
      return;
    }

    const isBlockedByCooldown = await CooldownValidator(
      message,
      client,
      command,
    );
    if (isBlockedByCooldown) return true;

    let ptx: PipelineCtx<CommandPipeline<Command, any, any>, any>;

    if (command.options.pipeLine) {
      ptx = await command.options.pipeLine.runUntil(
        command.options.pipeLineUntil as string,
        message,
      );
      if (!ptx) return;
    }

    const ctx = new CommandCTX({
      client,
      message,
    });

    try {
      const resolvedArgs = await PrefixCommandInteractionArgsResolver(
        client,
        message,
        command,
      );  

      await command.run({
        ctx,
        ptx,
        client,
        args: resolvedArgs,
      });
    } catch (error) {
      console.error(error);
      const repliedMessage = await message.reply({
        content: "There was an error trying to execute that command!",
      });
      setTimeout(() => {
        repliedMessage.delete();
      }, 5000);
      return;
    }
  }
}

export default CommandRegisterer;
