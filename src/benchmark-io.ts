import { decode } from 'iconv-lite'
import { rimrafSync } from 'rimraf'
import { sync as spawnSync } from 'cross-spawn'
import { env, execPath, platform } from 'node:process'
import { delimiter, dirname, join } from 'node:path'
import { existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs'

import { Logger } from './benchmark-logger'
import { PresetPM, PresetPMVersionArgName } from './benchmark-shared'

interface DetectOptions {
  env?: NodeJS.ProcessEnv
  cwd?: string
  command?: PresetPMVersionArgName
}

export class IO {
  static readonly spawnSync = spawnSync

  static readonly ENCODING_ICONV = 'cp936'
  static readonly ENCODING_STDIO: BufferEncoding = 'binary'

  static readonly COMMAND_VERSION: PresetPMVersionArgName = '--version'

  /** @description 解决控制台输出中文乱码问题 */
  static decode(stdio: string) {
    const strToBuffer = Buffer.from(stdio, this.ENCODING_STDIO)
    return decode(strToBuffer, this.ENCODING_ICONV).replace(/\r\n/g, '').trim()
  }

  static detectPMVersion(pm: PresetPM, options: DetectOptions = {}) {
    const { cwd, env, command = '--version' } = options
    const { error, stderr, stdout } = spawnSync(pm, [command], { cwd, env, encoding: this.ENCODING_STDIO })

    if (!error) return this.decode(stdout)

    Logger.Error(`## detection failure: ${pm} may not be installed yet.`)
    Logger.Wrap()
    throw new Error(this.decode(stderr))
  }

  static cleanDir(dir: string, cb: () => void) {
    if (!existsSync(dir)) return
    rimrafSync(dir)
    cb()
  }

  static statFolder(dir: string): number {
    const map = new Map<number, number>()

    const loop = (path: string) => {
      const stat = lstatSync(path)

      if (stat.isFile()) {
        map.set(stat.ino, stat.size)
      } else {
        // TODO To Async
        readdirSync(path).forEach((subPath) => loop(join(path, subPath)))
      }
    }

    loop(dir)

    return Array.from(map.values()).reduce((prev, curr) => (prev += curr), 0)
  }

  static byteToMiB(byte: number) {
    return `${(byte / 1024 ** 2).toFixed(2)} MiB`
  }

  static msToSeconds(milliseconds: number) {
    return `${(milliseconds / 1000).toFixed(2)}s`
  }

  static streamToString(...stream: string[]) {
    return stream.join(' ').replace(/\s+/g, ' ').trim()
  }

  /** @see https://github.com/sindresorhus/path-key */
  static getPathKey() {
    if (platform !== 'win32') return 'PATH'

    const pathKey = Object.keys(env)
      .reverse()
      .find((key) => key.toUpperCase() === 'PATH')

    return pathKey || 'Path'
  }

  static createEnv(workspace: string) {
    const pathKey = this.getPathKey()
    const stdioEnv = Object.create(env) as NodeJS.ProcessEnv

    const installersPath = join(workspace, 'node_modules', '.bin')
    stdioEnv[pathKey] = [installersPath, dirname(execPath), env[pathKey]].join(delimiter)

    return stdioEnv
  }

  static createHeart(bool: boolean) {
    return bool ? '🧡' : '🤍'
  }

  static createWorkSpace(cwd: string, directory: string) {
    Logger.Info(`## generate workspace directory ...`)

    const workspace = join(cwd, directory)
    mkdirSync(workspace)

    Logger.Info(`## workspace directory created: ${workspace}`)

    return workspace
  }

  static removeWorkSpace(cwd: string, directory: string) {
    const cachedDir = readdirSync(cwd)
      .filter((dir) => dir === directory)
      .map((dir) => join(cwd, dir))

    if (!cachedDir.length) return

    Logger.Warn(`## discover workspace directory ...`)

    // TODO 增加删除 Loading | 合并遍历 | To Async
    cachedDir.forEach((dir) => Logger.Warn(`## workspace directory deleted: ${dir}`))
    rimrafSync(cachedDir)
  }
}
