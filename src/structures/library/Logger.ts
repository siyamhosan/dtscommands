import chalk from 'chalk'

/** Numeric order: higher = more verbose. */
export enum LogLevel {
  Silent = 0,
  Error = 1,
  Warn = 2,
  Info = 3,
  Debug = 4,
  Verbose = 5,
}

type LogType = 'info' | 'warn' | 'error' | 'debug' | 'trace'

/** Captured once — never mutates global `console`. */
const native = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
}

export interface LoggerOptions {
  /** Minimum level to emit (default: Info). */
  level?: LogLevel
  /** Single segment; combined with `parent` as `[a][b]`. */
  group?: string
  parent?: Logger
  /** Full group chain (used by `withLevel` / internal clones). */
  groups?: string[]
}

function formatTimestamp (): string {
  return new Date().toLocaleString().toUpperCase().replace(', ', ' ')
}

function colorize (level: LogType): string {
  const map: Record<LogType, string> = {
    info: chalk.green('INFO'),
    warn: chalk.yellow('WARN'),
    error: chalk.red('ERROR'),
    debug: chalk.whiteBright('DEBUG'),
    trace: chalk.whiteBright('TRACE'),
  }
  return map[level]
}

function tookColor (seconds: number): string {
  if (seconds < 5) return chalk.greenBright(seconds + 's')
  if (seconds < 15) return chalk.yellowBright(seconds + 's')
  return chalk.redBright(seconds + 's')
}

export class Logger {
  private readonly level: LogLevel
  private readonly groups: string[]

  constructor (options: LoggerOptions = {}) {
    const parent = options.parent
    this.level =
      options.level ??
      parent?.getLevel() ??
      LogLevel.Info

    if (options.groups && options.groups.length > 0) {
      this.groups = [...options.groups]
    } else if (parent && options.group) {
      this.groups = [...parent.groups, options.group]
    } else if (options.group) {
      this.groups = [options.group]
    } else {
      this.groups = []
    }
  }

  getLevel (): LogLevel {
    return this.level
  }

  /** Scoped logger: `[parent][name]`. */
  child (name: string): Logger {
    return new Logger({ parent: this, group: name })
  }

  /** Same groups, different minimum level. */
  withLevel (level: LogLevel): Logger {
    return new Logger({ level, groups: this.groups })
  }

  private groupLabel (extra?: string): string {
    const parts = extra ? [...this.groups, extra] : this.groups
    if (parts.length === 0) return ''
    return parts.map((g) => `[${g}]`).join('')
  }

  private baseLine (level: LogType, message: string, group?: string): string {
    const d = formatTimestamp()
    const gl = this.groupLabel(group)
    const tag = colorize(level)
    return gl ? `[${d} ${tag}] ${gl} ${message}` : `[${d} ${tag}] ${message}`
  }

  private should (min: LogLevel): boolean {
    return this.level >= min
  }

  info (text: string, group?: string): void {
    if (!this.should(LogLevel.Info)) return
    native.info(this.baseLine('info', text, group))
  }

  warn (text: string, group?: string): void {
    if (!this.should(LogLevel.Warn)) return
    native.warn(this.baseLine('warn', text, group))
  }

  error (text: string | Error, group?: string): void {
    if (!this.should(LogLevel.Error)) return
    const d = formatTimestamp()
    const errorMessage = text instanceof Error ? text.message : text
    const stack = text instanceof Error ? '\n' + text.stack : ''
    const gl = this.groupLabel(group)
    const tag = colorize('error')
    const line = gl
      ? `[${d} ${tag}] ${gl} ${errorMessage}${stack}`
      : `[${d} ${tag}] ${errorMessage}${stack}`
    native.error(line)
  }

  debug (text: string, group?: string): void {
    if (!this.should(LogLevel.Debug)) return
    native.info(this.baseLine('debug', text, group))
  }

  /** Duration since `start` (ms). Respects `Info` so startup timing stays visible at default level. */
  trace (start: number, text: string, group?: string): void {
    if (!this.should(LogLevel.Info)) return
    const took = (Date.now() - start) / 1000
    const suffix = `${text} ${tookColor(took)}`
    native.info(this.baseLine('debug', suffix, group))
  }
}

export function createLogger (options?: LoggerOptions): Logger {
  return new Logger(options)
}

/** Library default; does not touch global `console`. */
export const defaultLogger = createLogger()

export default createLogger
