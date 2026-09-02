const MAX_LOGS = 50
const buffer: string[] = []

type BugLevel = 'INFO' | 'WARN' | 'ERROR'

export interface BugErrorInfo {
  message: string
}

let errorHandler: ((info: BugErrorInfo) => void) | null = null
let installed = false

function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string')
    return arg
  if (arg instanceof Error)
    return arg.stack || `${arg.name}: ${arg.message}`
  try {
    return JSON.stringify(arg)
  }
  catch {
    return String(arg)
  }
}

function push(level: BugLevel, args: unknown[]): void {
  const message = args.map(stringifyArg).join(' ')
  buffer.push(`${timestamp()} [${level}] ${message}`)
  if (buffer.length > MAX_LOGS)
    buffer.shift()

  if (level === 'ERROR' && errorHandler) {
    try {
      errorHandler({ message: message.slice(0, 300) })
    }
    catch { }
  }
}

export function getBugLogs(): string[] {
  return [...buffer]
}

export function onBugError(cb: (info: BugErrorInfo) => void): void {
  errorHandler = cb
}

export function installBugLogger(): void {
  if (installed)
    return
  installed = true

  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  }

  console.log = (...args: unknown[]) => {
    push('INFO', args)
    original.log(...args)
  }
  console.warn = (...args: unknown[]) => {
    push('WARN', args)
    original.warn(...args)
  }
  console.error = (...args: unknown[]) => {
    push('ERROR', args)
    original.error(...args)
  }

  window.addEventListener('error', (event) => {
    push('ERROR', [`Uncaught: ${event.message}`, event.filename ? `@ ${event.filename}:${event.lineno}` : ''])
  })

  window.addEventListener('unhandledrejection', (event) => {
    push('ERROR', [`Unhandled rejection: ${stringifyArg(event.reason)}`])
  })
}
