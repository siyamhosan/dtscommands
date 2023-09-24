import Bot from '../library/Client'
import { CommandsEvent } from './command'
import { InteractionCommandEvent } from './interaction'

export const botCommandEventsManager = async (client: Bot) => {
  const events = [
    new CommandsEvent(client),
    new InteractionCommandEvent(client)
  ]

  for (const event of events) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    client.on(event.options.name, ctx => {
      // @ts-ignore
      event.run(ctx)
    })
  }
}
