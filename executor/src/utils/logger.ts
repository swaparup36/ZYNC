import chalk from "chalk";

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

let DEBUG_ENABLED = false;

export function setDebug(enabled: boolean) {
  DEBUG_ENABLED = enabled;
}

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string) {
  const time = chalk.gray(`[${timestamp()}]`);

  switch (level) {
    case "info":
      console.log(`${time} ${chalk.cyan(message)}`);
      break;

    case "warn":
      console.log(`${time} ${chalk.yellow(message)}`);
      break;

    case "error":
      console.log(`${time} ${chalk.red(message)}`);
      break;

    case "success":
      console.log(`${time} ${chalk.green(message)}`);
      break;

    case "debug":
      if (DEBUG_ENABLED) {
        console.log(`${time} ${chalk.magenta(message)}`);
      }
      break;
  }
}

export const logger = {
  info: (msg: string) => log("info", msg),
  warn: (msg: string) => log("warn", msg),
  error: (msg: string) => log("error", msg),
  success: (msg: string) => log("success", msg),
  debug: (msg: string) => log("debug", msg),
};
