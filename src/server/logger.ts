type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || 'info';

const shouldLog = (level: LogLevel) => levelOrder[level] >= levelOrder[LOG_LEVEL];

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  if (!shouldLog(level)) {
    return;
  }
  const payload = meta ? { message, meta } : { message };
  const timestamp = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level](`[${timestamp}] ${level.toUpperCase()}:`, payload);
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
};
