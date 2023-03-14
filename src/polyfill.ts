import chalk from 'chalk'
import { tmpdir } from 'node:os'
import { realpathSync } from 'node:fs'

export { sync as spawnSync } from 'cross-spawn'

export class Logger {
  static Warn(log: string) {
    console.log(chalk.yellow(log))
  }

  static Info(log: string) {
    console.log(chalk.cyan(log))
  }

  static Tips(log: string) {
    console.log(chalk.bgGreen(log))
  }

  static Error(log: string) {
    console.log(chalk.red(log))
  }
}

/** @see https://github.com/sindresorhus/temp-dir */
export function getOSTmpDir() {
  return realpathSync(tmpdir())
}
