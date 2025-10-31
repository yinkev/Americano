/**
 * Structured Logging Service with PII Redaction
 *
 * Epic 3 - Observability Infrastructure
 *
 * Features:
 * - Winston-based structured logging
 * - Automatic PII redaction (emails, queries, medical PHI)
 * - Correlation ID tracking for distributed tracing
 * - Environment-aware formatting (verbose dev, JSON prod)
 * - Log levels: error, warn, info, http, debug
 * - Request/response logging middleware
 * - Performance metrics tracking
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * logger.info('Search query executed', {
 *   query: 'cardiac conduction',  // Automatically hashed if contains PII
 *   resultCount: 42,
 *   correlationId: req.headers['x-correlation-id']
 * })
 * ```
 */

import winston from 'winston'
import { hashSensitiveData, redactPII } from './logger-pii-redaction'

/**
 * Log levels (priority order: error > warn > info > http > debug)
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug'

/**
 * Structured log metadata
 */
export interface LogMetadata {
  /** Correlation ID for request tracing */
  correlationId?: string
  /** User ID (for audit trails, NOT PII fields) */
  userId?: string
  /** Request ID */
  requestId?: string
  /** Service/subsystem name */
  service?: string
  /** Operation/function name */
  operation?: string
  /** Duration in milliseconds */
  duration?: number
  /** HTTP status code */
  statusCode?: number
  /** Error object */
  error?: Error | unknown
  /** Additional context data */
  [key: string]: unknown
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  /** Log level (default: info in prod, debug in dev) */
  level?: LogLevel
  /** Enable console output (default: true) */
  console?: boolean
  /** Enable file output (default: true in prod) */
  file?: boolean
  /** File path for logs (default: logs/app.log) */
  filePath?: string
  /** Enable PII redaction (default: true) */
  redactPII?: boolean
  /** Service name for logging context */
  serviceName?: string
}

/**
 * Custom format for development (colorized, human-readable)
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, correlationId, ...meta } = info as {
      timestamp?: string
      level: string
      message: string
      service?: string
      correlationId?: string
      [key: string]: unknown
    }

    const ts = timestamp ?? new Date().toISOString()
    let log = `${ts} [${level}]`

    if (service) {
      log += ` [${service}]`
    }

    if (correlationId) {
      log += ` [cid:${correlationId.substring(0, 8)}]`
    }

    log += `: ${String(message)}`

    // Add metadata if present
    const metaKeys = Object.keys(meta).filter((key) => key !== 'timestamp')
    if (metaKeys.length > 0) {
      const cleanMeta = metaKeys.reduce(
        (acc, key) => {
          const value = (meta as Record<string, unknown>)[key]
          if (value !== undefined) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, unknown>,
      )
      log += ` ${JSON.stringify(cleanMeta, null, 2)}`
    }

    return log
  }),
)

/**
 * Custom format for production (structured JSON)
 */
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
)

/**
 * PII redaction format (applied before other formats)
 */
const piiRedactionFormat = winston.format((info: any) => {
  // Redact PII from message
  if (typeof info.message === 'string') {
    info.message = redactPII(info.message)
  }

  // Redact PII from metadata
  const redactedInfo = { ...info }

  // Known sensitive fields to hash instead of redact
  const hashFields = ['query', 'searchQuery', 'userQuery', 'conceptName', 'objectiveName']

  for (const field of hashFields) {
    if (redactedInfo[field] && typeof redactedInfo[field] === 'string') {
      redactedInfo[field] = hashSensitiveData(redactedInfo[field] as string)
    }
  }

  // Redact email addresses from any string fields
  for (const key in redactedInfo) {
    if (typeof redactedInfo[key] === 'string') {
      redactedInfo[key] = redactPII(redactedInfo[key] as string)
    }
  }

  // Redact error messages
  if (redactedInfo.error && typeof redactedInfo.error === 'object') {
    const error = redactedInfo.error as Error
    if (error.message) {
      error.message = redactPII(error.message)
    }
  }

  return redactedInfo
})

/**
 * Create Winston logger instance
 */
function createLogger(config: LoggerConfig = {}): winston.Logger {
  const {
    level = process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    console: enableConsole = true,
    file: enableFile = process.env.NODE_ENV === 'production',
    filePath = 'logs/app.log',
    redactPII: enablePIIRedaction = true,
    serviceName = 'americano-web',
  } = config

  const transports: winston.transport[] = []

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
      }),
    )
  }

  // File transport (production only by default)
  if (enableFile) {
    transports.push(
      new winston.transports.File({
        filename: filePath,
        format: prodFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    )

    // Separate error log file
    transports.push(
      new winston.transports.File({
        filename: filePath.replace('.log', '.error.log'),
        level: 'error',
        format: prodFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    )
  }

  // Create logger
  const logger = winston.createLogger({
    level,
    defaultMeta: { service: serviceName },
    format: enablePIIRedaction
      ? winston.format.combine(piiRedactionFormat(), winston.format.timestamp())
      : winston.format.timestamp(),
    transports,
    // Don't exit on error
    exitOnError: false,
  })

  return logger
}

/**
 * Singleton logger instance
 */
const winstonLogger = createLogger()

/**
 * Logger class with convenience methods
 */
export class Logger {
  constructor(
    private defaultMeta: LogMetadata = {},
    private winstonInstance: winston.Logger = winstonLogger,
  ) {}

  /**
   * Create a child logger with additional default metadata
   */
  child(meta: LogMetadata): Logger {
    return new Logger({ ...this.defaultMeta, ...meta }, this.winstonInstance)
  }

  /**
   * Log error message
   */
  error(message: string, meta?: LogMetadata): void {
    this.winstonInstance.error(message, { ...this.defaultMeta, ...meta })
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: LogMetadata): void {
    this.winstonInstance.warn(message, { ...this.defaultMeta, ...meta })
  }

  /**
   * Log info message
   */
  info(message: string, meta?: LogMetadata): void {
    this.winstonInstance.info(message, { ...this.defaultMeta, ...meta })
  }

  /**
   * Log HTTP request/response
   */
  http(message: string, meta?: LogMetadata): void {
    this.winstonInstance.http(message, { ...this.defaultMeta, ...meta })
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, meta?: LogMetadata): void {
    this.winstonInstance.debug(message, { ...this.defaultMeta, ...meta })
  }

  /**
   * Log performance metric
   */
  performance(operation: string, duration: number, meta?: LogMetadata): void {
    this.info(`Performance: ${operation}`, {
      ...meta,
      operation,
      duration,
      metric: 'performance',
    })
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, meta?: LogMetadata): void {
    this.http(`${method} ${path}`, {
      ...meta,
      method,
      path,
      type: 'request',
    })
  }

  /**
   * Log API response
   */
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    meta?: LogMetadata,
  ): void {
    this.http(`${method} ${path} ${statusCode}`, {
      ...meta,
      method,
      path,
      statusCode,
      duration,
      type: 'response',
    })
  }

  /**
   * Log database query
   */
  query(operation: string, table: string, duration: number, meta?: LogMetadata): void {
    this.debug(`DB Query: ${operation} on ${table}`, {
      ...meta,
      operation,
      table,
      duration,
      type: 'database',
    })
  }

  /**
   * Log embedding generation
   */
  embedding(operation: string, textLength: number, duration: number, meta?: LogMetadata): void {
    this.info(`Embedding: ${operation}`, {
      ...meta,
      operation,
      textLength,
      duration,
      type: 'embedding',
    })
  }

  /**
   * Log search operation
   */
  search(query: string, resultCount: number, duration: number, meta?: LogMetadata): void {
    // Query is automatically hashed by PII redaction
    this.info('Search executed', {
      ...meta,
      query, // Will be hashed by redaction format
      resultCount,
      duration,
      type: 'search',
    })
  }

  /**
   * Log graph operation
   */
  graph(operation: string, nodeCount: number, duration: number, meta?: LogMetadata): void {
    this.info(`Graph: ${operation}`, {
      ...meta,
      operation,
      nodeCount,
      duration,
      type: 'graph',
    })
  }

  /**
   * Log rate limit event
   */
  rateLimit(service: string, limit: number, current: number, meta?: LogMetadata): void {
    this.warn(`Rate limit: ${service}`, {
      ...meta,
      service,
      limit,
      current,
      usage: `${current}/${limit}`,
      type: 'rate-limit',
    })
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a logger with default metadata (useful for subsystems)
 */
export function createLoggerWithMeta(meta: LogMetadata): Logger {
  return new Logger(meta)
}

/**
 * Create a logger for a specific service/subsystem
 */
export function createServiceLogger(serviceName: string): Logger {
  return new Logger({ service: serviceName })
}

/**
 * Export Winston instance for advanced use cases
 */
export { winstonLogger }
