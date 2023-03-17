import { v4 } from 'uuid'
import { decode } from 'iconv-lite'
import { rimrafSync } from 'rimraf'
import { env, execPath } from 'node:process'
import { sync as spawnSync } from 'cross-spawn'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'

import { Logger } from './benchmark-logger'
import { InstallerVariables, PresetPM, PresetPMVersionArgName } from './benchmark-shared'

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

  /** @description 探测包管理器的版本 */
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

  static msToSeconds(milliseconds: number) {
    return `${(milliseconds / 1000).toFixed(2)}s`
  }

  static streamToString(...stream: string[]) {
    return stream.join(' ').replace(/\s+/g, ' ').trim()
  }

  static createEnv(workspace: string) {
    const pathKey = 'PATH'
    const stdioEnv = Object.create(env) as NodeJS.ProcessEnv

    const installersPath = join(workspace, 'node_modules', '.bin')
    stdioEnv[pathKey] = [installersPath, dirname(execPath), env[pathKey]].join(delimiter)

    return stdioEnv
  }

  static createHeart(bool: boolean) {
    return bool ? '🧡' : '🤍'
  }

  static normalizeArgs(registry: string, commandVariables: InstallerVariables) {
    const commandArgs: string[] = []
    const { args = [], cache, store, ignores } = commandVariables

    commandArgs.push(`--registry=${registry}`)
    commandArgs.push(...args)
    commandArgs.push(...Object.values(ignores))
    commandArgs.push(`${cache.key}=${cache.dir}`)
    store && commandArgs.push(`${store.key}=${store.dir}`)

    return commandArgs
  }

  static createWorkSpace(cwd: string, prefix: string) {
    Logger.Info(`## generate workspace directory ...`)

    const workspace = join(cwd, `${prefix}-${v4()}`)
    mkdirSync(workspace)

    Logger.Info(`## workspace directory created: ${workspace}`)

    return workspace
  }

  static removeWorkSpace(cwd: string, prefix: string) {
    const cachedDir = readdirSync(cwd)
      .filter((dir) => dir.includes(prefix))
      .map((dir) => join(cwd, dir))

    if (!cachedDir.length) return

    Logger.Warn(`## discover workspace directory ...`)

    // TODO 增加删除 Loading | 合并遍历
    cachedDir.forEach((dir) => Logger.Warn(`## workspace directory deleted: ${dir}`))
    rimrafSync(cachedDir)
  }
}
