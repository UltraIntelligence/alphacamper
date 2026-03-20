const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 } as const;
type Level = keyof typeof LEVELS;

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= (LEVELS[LOG_LEVEL as Level] ?? LEVELS.info);
}

function timestamp(): string {
  return new Date().toISOString();
}

export const log = {
  debug(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("debug")) console.log(`${timestamp()} [debug] ${msg}`, data ?? "");
  },
  info(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("info")) console.log(`${timestamp()} [info] ${msg}`, data ?? "");
  },
  warn(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("warn")) console.warn(`${timestamp()} [warn] ${msg}`, data ?? "");
  },
  error(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("error")) console.error(`${timestamp()} [error] ${msg}`, data ?? "");
  },
  critical(msg: string, data?: Record<string, unknown>) {
    if (shouldLog("critical")) console.error(`${timestamp()} [CRITICAL] ${msg}`, data ?? "");
  },
};
