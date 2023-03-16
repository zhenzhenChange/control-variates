import chalk from 'chalk'
import { decode } from 'iconv-lite'

export { sync as spawnSync } from 'cross-spawn'

export class Helper {
  static ToSeconds(milliseconds: number) {
    return `${(milliseconds / 1000).toFixed(2)}s`
  }
}

export class Logger {
  static Wrap() {
    console.log('\r')
  }

  static Warn(log: string) {
    console.log(chalk.yellow(log))
  }

  static Info(log: string, customLog?: string) {
    console.log(chalk.cyan(log), chalk.magenta(customLog ?? ''))
  }

  static Tips(log: string) {
    console.log(chalk.bgGreen(log + ' '))
  }

  static Error(log: string) {
    console.log(chalk.red(log))
  }

  static Important(log: string) {
    console.log(chalk.rgb(242, 118, 53)(log))
  }
}

export class DecodeStdio {
  static readonly ICONV_ENCODING = 'cp936'
  static readonly STDIO_ENCODING: BufferEncoding = 'binary'

  /** @description 解决控制台输出中文乱码问题 */
  static decode(stdio: string) {
    const strToBuffer = Buffer.from(stdio, this.STDIO_ENCODING)

    return decode(strToBuffer, this.ICONV_ENCODING).replace(/\r\n/g, '').trim()
  }
}
