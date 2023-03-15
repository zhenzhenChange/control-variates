import { v4 } from 'uuid'
import { rimrafSync } from 'rimraf'
import { env, execPath } from 'node:process'
import { join, delimiter, dirname } from 'node:path'
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'

import { DecodeStdio, Logger, spawnSync } from './polyfill'
import { Config, Fixture, Installer, PresetPM, PresetPMMap } from './shared'

class ConfigFactory implements Config {
  cwd = process.cwd()
  limit = 3
  prefix = 'benchmark'
  registry = 'https://registry.npmjs.org'
  monorepo = false
  cleanCache = false
  pkgFileName = 'package.json'
  skipPMInstall = false
}

export class BenchmarkLauncher {
  #shellPM: string
  #shellPMCommand: string
  #shellPMCommandArgs: string[]

  #workspace: string
  #installers: Installer[]
  #benchmarkConfig: ConfigFactory

  constructor(private fixtures: Fixture[]) {}

  use<T extends keyof PresetPMMap>(pm: T, command: PresetPMMap[T], commandArgs: string[] = []) {
    Logger.Tips(`# Stage-PreparePM: ${pm}`)

    const result = spawnSync(pm, ['--version'], { encoding: DecodeStdio.STDIO_ENCODING })

    if (result.error) {
      Logger.Error(`## Failed Detection: ${pm} may not be installed yet.`)
      Logger.Wrap()
      throw new Error(DecodeStdio.decode(result.stderr))
    }
    Logger.Info(`## version: v${DecodeStdio.decode(result.stdout)}`)

    this.#shellPM = pm
    this.#shellPMCommand = command
    this.#shellPMCommandArgs = commandArgs

    Logger.Info(`## command: ${`${pm} ${command} ${commandArgs.join(' ')}`.trim()}`)
    Logger.Wrap()

    return { config: (config: Config) => this.#config(config) }
  }

  #config(config: Config) {
    this.#benchmarkConfig = Object.assign(new ConfigFactory(), config)
    const { cwd, prefix, cleanCache } = this.#benchmarkConfig

    Logger.Tips(`# Stage-PrepareWorkSpace: ${cwd} -> ${prefix}`)

    cleanCache && this.#removeWorkSpace(cwd, prefix)
    this.#createWorkSpace(cwd, prefix)

    Logger.Wrap()

    return { register: (installers: Installer[]) => this.#register(installers) }
  }

  #register(installers: Installer[]) {
    this.#installers = installers
    const normalized = installers.map(({ pm, version }) => `${pm}@${version ?? 'latest'}`)
    Logger.Tips(`# Stage-PrepareInstallers: ${normalized.join(', ')}`)

    spawnSync(this.#shellPM, ['init'], { cwd: this.#workspace })
    Logger.Info(`## init pkgfile:`, `${join(this.#workspace, this.#benchmarkConfig.pkgFileName)}`)

    if (!this.#benchmarkConfig.skipPMInstall) {
      const merged = [this.#shellPMCommand, ...this.#shellPMCommandArgs, ...normalized]
      Logger.Info(`## init install:`, `${this.#shellPM} ${merged.join(' ')}`)
      Logger.Wrap()
      spawnSync(this.#shellPM, merged, { cwd: this.#workspace, stdio: 'inherit' })
    }

    Logger.Wrap()

    return { bootstrap: () => this.#bootstrap() }
  }

  #bootstrap() {
    Logger.Tips(`# Stage-SetupBenchmark`)

    // TODO 开启多线程
    this.fixtures.forEach((fixture, i) => {
      const fixturePkgPath = join(this.#benchmarkConfig.cwd, fixture.dir, this.#benchmarkConfig.pkgFileName)
      Logger.Info('## retrieved pkgfile:', fixturePkgPath)

      this.#installers.forEach((installer) => {
        const runDir = join(this.#workspace, fixture.dir, installer.pm)
        const runPkgPath = join(runDir, this.#benchmarkConfig.pkgFileName)

        mkdirSync(runDir, { recursive: true })
        copyFileSync(fixturePkgPath, runPkgPath)

        this.#runTask(installer.pm, runDir)
      })

      Logger.Wrap()
    })
  }

  #runTask(pm: PresetPM, runDir: string) {
    const runEnv = this.#createEnv()

    const { stdout } = spawnSync(pm, ['--version'], { env: runEnv, cwd: runDir, encoding: DecodeStdio.STDIO_ENCODING })
    Logger.Info(`## retrieved install: ${pm} v${DecodeStdio.decode(stdout)}`)

    // TODO
    // const TimeS = Date.now()
    // spawnSync(pm, ['install', '--ignore-scripts'], { cwd: runDir, stdio: 'inherit' })
    // const TimeE = Date.now()
    // Logger.Info(`### Time consuming: ${TimeE - TimeS}`)
  }

  #createEnv() {
    const pathKey = 'PATH'
    const stdioEnv = Object.create(env) as NodeJS.ProcessEnv

    const installersPath = join(this.#workspace, 'node_modules', '.bin')
    stdioEnv[pathKey] = [installersPath, dirname(execPath), env[pathKey]].join(delimiter)

    return stdioEnv
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

      rimrafSync(cachedDir)
    }
  }
}
