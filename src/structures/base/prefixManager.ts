import { Message } from 'discord.js'

export abstract class PrefixManager {
  public readonly onCustomAllowMain: boolean
  public readonly mainPrefix: string
  public readonly additionalPrefixes: string[]

  constructor (
    mainPrefix: string,
    additionalPrefixes: string[],
    onCustomAllowMain: boolean = true
  ) {
    this.mainPrefix = mainPrefix
    this.additionalPrefixes = additionalPrefixes
    this.onCustomAllowMain = onCustomAllowMain
  }

  abstract getPrefix({
    message
  }: {
    message: Message
  }): Promise<string[]> | string[]
}
