import { v4 } from 'uuid'
import { rimrafSync } from 'rimraf'
import { env, execPath } from 'node:process'
import { join, delimiter, dirname } from 'node:path'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'

import { DecodeStdio, Helper, Logger, spawnSync } from './polyfill'
import { Config, Fixture, Installer, InstallerVariables, PresetPM, PresetPMLockFileName, PresetPMMap } from './shared'

class ConfigFactory implements Config {
  cwd = process.cwd()
  limit = 3
  prefix = 'benchmark'
  registry = 'https://registry.npmjs.org'
  monorepo = false
  cleanLegacy = false
  pkgFileName = 'package.json'
  skipPMInstall = false
}

export class Benchmark {
  #shellPM: string
  #shellPMCommand: string
  #shellPMCommandArgs: string[]

  #workspace: string
  #installers: Installer[]
  #benchmarkConfig: ConfigFactory

  constructor(private fixtures: Fixture[]) {}

  use<T extends keyof PresetPMMap>(pm: T, command: PresetPMMap[T], commandArgs: string[] = []) {
    Logger.Tips(`# Stage-PreparePM`)

    const result = spawnSync(pm, ['--version'], { encoding: DecodeStdio.STDIO_ENCODING })

    if (result.error) {
      Logger.Error(`## Failed Detection: ${pm} may not be installed yet.`)
      Logger.Wrap()
      throw new Error(DecodeStdio.decode(result.stderr))
    }
    Logger.Info(`## prepare version:`, `${pm} v${DecodeStdio.decode(result.stdout)}`)

    this.#shellPM = pm
    this.#shellPMCommand = command
    this.#shellPMCommandArgs = commandArgs

    Logger.Info(`## prepare command:`, `${pm} ${command} ${commandArgs.join(' ')}`.trim())
    Logger.Wrap()

    return { config: (config?: Config) => this.#config(config) }
  }

  #config(config?: Config) {
    this.#benchmarkConfig = Object.assign(new ConfigFactory(), config)
    const { cwd, prefix, cleanLegacy } = this.#benchmarkConfig

    Logger.Tips(`# Stage-PrepareWorkSpace`)
    Logger.Info(`## workspace:`, cwd)
    Logger.Info(`## directory:`, prefix)

    cleanLegacy && this.#removeWorkSpace(cwd, prefix)
    this.#createWorkSpace(cwd, prefix)

    Logger.Wrap()

    return { register: (installers: Installer[]) => this.#register(installers) }
  }

  #register(installers: Installer[]) {
    this.#installers = installers
    Logger.Tips(`# Stage-PrepareInstallers`)

    spawnSync(this.#shellPM, ['init'], { cwd: this.#workspace })
    Logger.Info(`## init pkgfile:`, `${join(this.#workspace, this.#benchmarkConfig.pkgFileName)}`)

    if (!this.#benchmarkConfig.skipPMInstall) {
      const normalized = this.#installers.map(({ pm, version }) => `${pm}@${version ?? 'latest'}`)
      const merged = [this.#shellPMCommand, ...this.#shellPMCommandArgs, ...normalized]
      Logger.Info(`## init command:`, `${this.#shellPM} ${merged.join(' ')}`)
      Logger.Wrap()
      spawnSync(this.#shellPM, merged, { cwd: this.#workspace, stdio: 'inherit' })
    }

    Logger.Wrap()

    return { bootstrap: () => this.#bootstrap() }
  }

  #bootstrap() {
    Logger.Tips(`# Stage-BootstrapBenchmark`)

    // TODO 开启多线程
    this.fixtures.forEach((fixture, i) => {
      const fixturePkgPath = join(this.#benchmarkConfig.cwd, fixture.dir, this.#benchmarkConfig.pkgFileName)
      Logger.Info('## retrieved pkgfile:', fixturePkgPath)

      this.#installers.forEach((installer) => {
        const runDir = join(this.#workspace, fixture.dir, installer.pm)
        const runPkgPath = join(runDir, this.#benchmarkConfig.pkgFileName)

        mkdirSync(runDir, { recursive: true })
        copyFileSync(fixturePkgPath, runPkgPath)

        this.#runTask(runDir, installer)
      })
    })
  }

  #runTask(runDir: string, installer: Installer) {
    const { pm } = installer
    const runEnv = this.#createEnv()

    const { stdout } = spawnSync(pm, ['--version'], { env: runEnv, cwd: runDir, encoding: DecodeStdio.STDIO_ENCODING })
    const parsedPMVersion = `${pm} v${DecodeStdio.decode(stdout)}`

    Logger.Wrap()
    Logger.Info(`## retrieved version:`, parsedPMVersion)

    const cacheDir = installer.commandVariables.cache.dir
    const storeDir = installer.commandVariables.store?.dir
    const lockFileName = installer.commandVariables.lockFileName
    const commandArgs = this.#normalizeArgs(installer.commandVariables)

    const installCommandArgs = ['install', ...commandArgs]
    Logger.Info(`## retrieved command:`, `${pm} ${installCommandArgs.join(' ')}`.trim())
    Logger.Info('## retrieved control:', '🤍 No | 🧡 Has')
    Logger.Wrap()

    // 1.
    Logger.Info('## 👇 control-variates:', '🤍 cache | 🤍 lockfile | 🤍 node_modules')
    this.#cleanCache(runDir, cacheDir)
    this.#cleanLockFile(runDir, lockFileName)
    this.#cleanNodeModules(runDir)
    const Time1 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time1)}`)
    Logger.Wrap()

    // 2.
    Logger.Info('## 👇 control-variates:', '🧡 cache | 🤍 lockfile | 🤍 node_modules')
    this.#cleanLockFile(runDir, lockFileName)
    this.#cleanNodeModules(runDir)
    const Time2 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time2)}`)
    Logger.Wrap()

    // 3.
    Logger.Info('## 👇 control-variates:', '🤍 cache | 🧡 lockfile | 🤍 node_modules')
    this.#cleanCache(runDir, cacheDir)
    this.#cleanNodeModules(runDir)
    const Time3 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time3)}`)
    Logger.Wrap()

    // 4.
    Logger.Info('## 👇 control-variates:', '🤍 cache | 🤍 lockfile | 🧡 node_modules')
    this.#cleanCache(runDir, cacheDir)
    this.#cleanLockFile(runDir, lockFileName)
    const Time4 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time4)}`)
    Logger.Wrap()

    // 5.
    Logger.Info('## 👇 control-variates:', '🧡 cache | 🧡 lockfile | 🤍 node_modules')
    this.#cleanNodeModules(runDir)
    const Time5 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time5)}`)
    Logger.Wrap()

    // 6.
    Logger.Info('## 👇 control-variates:', '🧡 cache | 🤍 lockfile | 🧡 node_modules')
    this.#cleanLockFile(runDir, lockFileName)
    const Time6 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time6)}`)
    Logger.Wrap()

    // 7.
    Logger.Info('## 👇 control-variates:', '🤍 cache | 🧡 lockfile | 🧡 node_modules')
    this.#cleanCache(runDir, cacheDir)
    const Time7 = this.#runInstall(pm, runDir, installCommandArgs)
    Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} - ${Helper.ToSeconds(Time7)}`)
  }

  #runInstall(pm: PresetPM, runDir: string, installCommand: string[]) {
    Logger.Wrap()

    // TODO 若 package.json 中的依赖过多，当使用 Pnpm 进行安装时，磁盘占用率达到了 100%，可能会导致操作系统卡死
    const TimeS = Date.now()
    spawnSync(pm, installCommand, { cwd: runDir, stdio: 'inherit' })
    const TimeE = Date.now()

    Logger.Wrap()

    return TimeE - TimeS
  }

  #cleanCache(runDir: string, cacheDir: string, storeDir?: string) {
    const merged = join(runDir, cacheDir)
    const isExist = existsSync(merged)
    if (isExist) {
      Logger.Info('## clean cache:', merged)
      rimrafSync(merged)
    }

    if (storeDir) {
      const merged = join(runDir, storeDir)
      const isExist = existsSync(merged)
      if (isExist) {
        Logger.Info('## clean store:', merged)
        rimrafSync(merged)
      }
    }
  }

  #cleanLockFile(runDir: string, lockFileName: PresetPMLockFileName) {
    const merged = join(runDir, lockFileName)
    const isExist = existsSync(merged)

    if (!isExist) return

    Logger.Info('## clean lockfile:', merged)
    rimrafSync(merged)
  }

  #cleanNodeModules(runDir: string) {
    const merged = join(runDir, 'node_modules')
    const isExist = existsSync(merged)

    if (!isExist) return

    Logger.Info('## clean node_modules:', merged)
    rimrafSync(merged)
  }

  #createEnv() {
    const pathKey = 'PATH'
    const stdioEnv = Object.create(env) as NodeJS.ProcessEnv

    const installersPath = join(this.#workspace, 'node_modules', '.bin')
    stdioEnv[pathKey] = [installersPath, dirname(execPath), env[pathKey]].join(delimiter)

    return stdioEnv
  }

  #normalizeArgs(commandVariables: InstallerVariables) {
    const commandArgs: string[] = []
    const { args = [], cache, store, ignores } = commandVariables

    commandArgs.push(`--registry=${this.#benchmarkConfig.registry}`)
    commandArgs.push(...args)
    commandArgs.push(...Object.values(ignores))
    commandArgs.push(`${cache.key}=${cache.dir}`)
    store && commandArgs.push(`${store.key}=${store.dir}`)

    return commandArgs
  }

  #createWorkSpace(cwd: string, prefix: string) {
    Logger.Info(`## generate workspace directory ...`)

    this.#workspace = join(cwd, `${prefix}-${v4()}`)
    mkdirSync(this.#workspace)

    Logger.Info(`## workspace directory created: ${this.#workspace}`)
  }

  #removeWorkSpace(cwd: string, prefix: string) {
    const cachedDir = readdirSync(cwd)
      .filter((dir) => dir.includes(prefix))
      .map((dir) => join(cwd, dir))

    if (cachedDir.length) {
      Logger.Warn(`## discover workspace directory ...`)
      cachedDir.forEach((dir) => Logger.Warn(`## workspace directory deleted: ${dir}`))

      // TODO 增加删除 Loading
      rimrafSync(cachedDir)
    }
  }
}
