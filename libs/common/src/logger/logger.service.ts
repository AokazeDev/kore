import { Injectable, Scope, type LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import { envs } from '../config/envs';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private logger: pino.Logger;
  private context?: string;

  constructor() {
    const loggerOptions: pino.LoggerOptions = {
      level: envs.nodeEnv === 'production' ? 'info' : 'debug',
      transport:
        envs.nodeEnv !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            }
          : undefined,
      formatters: {
        level: (label: string) => ({ level: label.toUpperCase() }),
        bindings: (bindings: { pid: number; hostname: string }) => ({
          pid: bindings.pid,
          host: bindings.hostname,
          node_version: process.version,
        }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        env: envs.nodeEnv,
      },
    };

    this.logger = pino(loggerOptions);
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, context?: string): void;
  log(message: string, ...optionalParams: unknown[]): void;
  log(message: string, ...optionalParams: unknown[]): void {
    const ctx = typeof optionalParams[0] === 'string' ? optionalParams[0] : this.context;
    this.logger.info({ context: ctx }, message);
  }

  error(message: string, trace?: string, context?: string): void;
  error(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void {
    const ctx =
      typeof optionalParams[optionalParams.length - 1] === 'string'
        ? optionalParams[optionalParams.length - 1]
        : this.context;
    const trace =
      typeof optionalParams[0] === 'string' && optionalParams.length > 1
        ? optionalParams[0]
        : undefined;

    this.logger.error(
      {
        context: ctx,
        trace,
      },
      message
    );
  }

  warn(message: string, context?: string): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void {
    const ctx = typeof optionalParams[0] === 'string' ? optionalParams[0] : this.context;
    this.logger.warn({ context: ctx }, message);
  }

  debug(message: string, context?: string): void;
  debug(message: string, ...optionalParams: unknown[]): void;
  debug(message: string, ...optionalParams: unknown[]): void {
    const ctx = typeof optionalParams[0] === 'string' ? optionalParams[0] : this.context;
    this.logger.debug({ context: ctx }, message);
  }

  verbose(message: string, context?: string): void;
  verbose(message: string, ...optionalParams: unknown[]): void;
  verbose(message: string, ...optionalParams: unknown[]): void {
    const ctx = typeof optionalParams[0] === 'string' ? optionalParams[0] : this.context;
    this.logger.trace({ context: ctx }, message);
  }

  /**
   * Create a child logger with additional context
   */
  child(bindings: pino.Bindings): LoggerService {
    const childLogger = new LoggerService();
    childLogger.logger = this.logger.child(bindings);
    childLogger.context = this.context;
    return childLogger;
  }

  /**
   * Get the underlying Pino logger instance
   */
  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}
