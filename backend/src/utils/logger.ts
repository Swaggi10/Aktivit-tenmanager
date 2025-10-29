/* eslint-disable no-console */

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(logMessage, meta || '');
      break;
    case LogLevel.WARN:
      console.warn(logMessage, meta || '');
      break;
    case LogLevel.DEBUG:
      if (process.env.NODE_ENV === 'development') {
        console.log(logMessage, meta || '');
      }
      break;
    default:
      console.info(logMessage, meta || '');
  }
};

export const logger = {
  info: (message: string, meta?: unknown) => log(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: unknown) => log(LogLevel.WARN, message, meta),
  error: (message: string, meta?: unknown) => log(LogLevel.ERROR, message, meta),
  debug: (message: string, meta?: unknown) => log(LogLevel.DEBUG, message, meta),
};
