import { Message } from "discord.js"

export abstract class PrefixManager {
    public readonly mainPrefix: string
    public readonly additionalPrefixes: string[]

    constructor(mainPrefix: string, additionalPrefixes: string[]) {
        this.mainPrefix = mainPrefix
        this.additionalPrefixes = additionalPrefixes
    }

    abstract getPrefix({ message }: { message: Message }): Promise<string[]> | string[]
}