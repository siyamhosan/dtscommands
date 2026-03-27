import { Message } from "discord.js";
import Bot from "../library/Client";



export async function parseArgsFromMessage(client: Bot, message: Message) {

        let prefixs: string[] = [];

    if (typeof client.config.prefix === "string") {
      prefixs = [client.config.prefix];
    } else {
      const prefixManager = await client.config.prefix.getPrefix({ message });
      if (client.config.prefix.onCustomAllowMain) {
        prefixs = [
          client.config.prefix.mainPrefix,
          ...client.config.prefix.additionalPrefixes,
          ...prefixManager,
        ];
      } else {
        prefixs = [
          ...prefixManager,
          ...client.config.prefix.additionalPrefixes,
        ];
      }
    }

    const prefix = prefixs[0] || "";

    const escapeRegex = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const escapedPrefixes = prefixs.map(escapeRegex);
    const prefixesRegexPart = escapedPrefixes.join("|");

    const prefixRegex = new RegExp(
      `^(<@!?${client.user?.id}>|${prefixesRegexPart})\\s*`,
    );
    if (!prefixRegex.test(message.content)) return {
        prefix: "",
        commandName: "",
        args: [],
    }

    const [matchedPrefix] = message.content.match(prefixRegex) || [""];

    const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase() || "";

    return {
        prefix,
        commandName,
        args,
    };
}