import chalk from 'chalk'

type LogType = 'info' | 'warn' | 'error' | 'debug' | 'trace'

interface Logger extends Console {
  info(text: string, group?: string): void
  warn(text: string, group?: string): void
  debug(text: string, group?: string): void
  error(text: string, group?: string): void
  trace(start: number, text: string, group?: string): void
}

const myConsole: Logger = console

function Logger () {
  const backup = {
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.timeLog
  }

  myConsole.info = (text: string, group?: string) => {
    const d = new Date().toLocaleString().toUpperCase().replace(', ', ' ')

    if (group) backup.info(`[${d} ${colorize('info')}] [${group}] ${text}`)
    else backup.info(`[${d} ${colorize('info')}] ${text}`)
  }

  myConsole.warn = (text: string, group?: string) => {
    const d = new Date().toLocaleString().toUpperCase().replace(', ', ' ')

    if (group) backup.info(`[${d} ${colorize('warn')}] [${group}] ${text}`)
    else backup.info(`[${d} ${colorize('warn')}] ${text}`)
  }

  myConsole.error = (text: string, group?: string) => {
    const d = new Date().toLocaleString().toUpperCase().replace(', ', ' ')

    if (group) backup.info(`[${d} ${colorize('error')}] [${group}] ${text}`)
    else backup.info(`[${d} ${colorize('error')}] ${text}`)
  }

  myConsole.debug = (text: string, group?: string) => {
    const d = new Date().toLocaleString().toUpperCase().replace(', ', ' ')

    if (group) backup.info(`[${d} ${colorize('debug')}] [${group}] ${text}`)
    else backup.info(`[${d} ${colorize('debug')}] ${text}`)
  }

  myConsole.trace = (start: number, text: string, group?: string) => {
    const d = new Date().toLocaleString().toUpperCase().replace(', ', ' ')
    const took = (Date.now() - start) / 1000
    const tookColor = (took: number) => {
      if (took < 5) return chalk.greenBright(took + 's')
      else if (took < 15) return chalk.yellowBright(took + 's')
      else return chalk.redBright(took + 's')
    }

    if (group) {
      backup.info(
        `[${d} ${colorize('debug')}] [${group}] ${text} ${tookColor(took)}`
      )
    } else backup.info(`[${d} ${colorize('debug')}] ${text} ${tookColor(took)}`)
  }
}

const colorize = (level: LogType): string => {
  const obj = {
    info: chalk.green('INFO'),
    warn: chalk.yellow('WARN'),
    error: chalk.red('ERROR'),
    debug: chalk.whiteBright('DEBUG'),
    trace: chalk.whiteBright('TRACE')
  }

  return obj[level]
}

export default Logger
