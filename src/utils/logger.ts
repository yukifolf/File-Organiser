/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ConsoleLogger, Injectable, LogLevel, Scope } from '@nestjs/common';
import * as path from 'path';
import { config } from 'node-config-ts';

const LogLevelSeverity: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
  fatal: 0,
};

@Injectable({ scope: Scope.TRANSIENT })
export class UltimateLogger extends ConsoleLogger {
  constructor() {
    const logLevels = UltimateLogger.getLogLevelsFromConfig();
    super('App', { logLevels });
  }

  log(message: any, ...optionalParams: any[]) {
    this.processLog('log', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.processLog('error', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.processLog('warn', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.processLog('debug', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.processLog('verbose', message, ...optionalParams);
  }

  private processLog(level: LogLevel, message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    this.context = this.getCallerContext();
    let stack: string | undefined;

    if (level === 'error') {
      const error =
        message instanceof Error
          ? message
          : optionalParams.find((p) => p instanceof Error);
      stack = error?.stack;
    } else if (this.isLevelEnabled('debug')) {
      stack = new Error().stack?.split('\n').slice(4).join('\n');
    }

    if (stack) {
      super[level](message, stack);
    } else {
      super[level](message);
    }
  }

  private getCallerContext(): string {
    try {
      const stack = new Error().stack?.split('\n');
      if (stack && stack.length > 4) {
        const callerLine = stack[4];
        // Improved regex to capture file path and line number
        const match = callerLine.match(/at .* \((.*):(\d+):\d+\)/);
        if (match && match[1]) {
          const fullPath = match[1];
          const line = match[2];
          const relativePath = path.relative(process.cwd(), fullPath);
          return `${relativePath}:${line}`;
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return 'UnknownContext';
    }
    return this.context || 'UnknownContext';
  }

  /**
   * Reads the configuration to determine which log levels are active.
   * @returns An array of active LogLevel strings.
   */
  private static getLogLevelsFromConfig(): LogLevel[] {
    const isDebugMode = config.server.debug === true;
    const effectiveLevel = isDebugMode ? 'debug' : 'log';

    const severities = Object.keys(LogLevelSeverity) as LogLevel[];
    const maxSeverity = LogLevelSeverity[effectiveLevel];

    return severities.filter((l) => LogLevelSeverity[l] <= maxSeverity);
  }
}
