import chalk from 'chalk'

export class Logger {
  static Wrap() {
    console.log('\r')
  }

  static Warn(log: unknown) {
    console.log(chalk.yellow(log))
  }

  static Info(log: unknown, customLog?: unknown) {
    console.log(chalk.cyan(log), chalk.magenta(customLog ?? ''))
  }

  static Tips(log: unknown) {
    console.log(chalk.bgGreen(log + ' '))
  }

  static Error(log: unknown) {
    console.log(chalk.red(log))
  }

  static Important(log: unknown) {
    console.log(chalk.rgb(242, 118, 53)(log))
  }
}
