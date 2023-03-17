import { join } from 'node:path'
import { copyFileSync, mkdirSync } from 'node:fs'

import { IO } from './benchmark-io'
import { Logger } from './benchmark-logger'
import { BenchmarkRecord, Config, Fixture, Installer, PresetPMLockFileName, PresetPMMap } from './benchmark-shared'

class PMCommandArgs {
  initCommandArgs: string[] = []
  installCommandArgs: string[] = []
}

class ConfigFactory implements Required<Config> {
  cwd = process.cwd()
  rounds = 3
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
  #shellPMCommandArgs: PMCommandArgs

  #workspace: string
  #installers: Installer[]
  #benchmarkConfig: ConfigFactory

  constructor(private fixtures: Fixture[]) {}

  // TODO 支持指定版本的探测
  use<T extends keyof PresetPMMap>(pm: T, command: PresetPMMap[T], commandArgs?: Partial<PMCommandArgs>) {
    const shellPMCommandArgs = Object.assign(new PMCommandArgs(), commandArgs)

    Logger.Tips(`# Stage-PreparePM`)
    Logger.Info(`## detect version:`, IO.streamToString(pm, `v${IO.detectPMVersion(pm)}`))
    Logger.Info(`## detect command:`, IO.streamToString(pm, command, ...shellPMCommandArgs.installCommandArgs))

    this.#shellPM = pm
    this.#shellPMCommand = command
    this.#shellPMCommandArgs = shellPMCommandArgs

    return { config: (config?: Config) => this.#config(config) }
  }

  #config(config?: Config) {
    Logger.Wrap()

    this.#benchmarkConfig = Object.assign(new ConfigFactory(), config)
    const { cwd, prefix, cleanLegacy } = this.#benchmarkConfig

    Logger.Tips(`# Stage-PrepareWorkSpace`)
    Logger.Info(`## deploy workspace:`, cwd)
    Logger.Info(`## deploy directory:`, prefix)

    cleanLegacy && IO.removeWorkSpace(cwd, prefix)
    this.#workspace = IO.createWorkSpace(cwd, prefix)

    return { register: (installers: Installer[]) => this.#register(installers) }
  }

  #register(installers: Installer[]) {
    Logger.Wrap()
    Logger.Tips(`# Stage-PrepareInstallers`)

    this.#installers = installers

    IO.spawnSync(this.#shellPM, ['init', ...this.#shellPMCommandArgs.initCommandArgs], { cwd: this.#workspace, stdio: 'inherit' })
    Logger.Info(`## create pkgfile:`, join(this.#workspace, this.#benchmarkConfig.pkgFileName))

    const normalized = this.#installers.map(({ pm, version }) => `${pm}@${version ?? 'latest'}`)
    const mergedCommandArgs = [this.#shellPMCommand, ...this.#shellPMCommandArgs.installCommandArgs, ...normalized]
    Logger.Info(`## create command:`, IO.streamToString(this.#shellPM, ...mergedCommandArgs))
    Logger.Wrap()
    IO.spawnSync(this.#shellPM, mergedCommandArgs, { cwd: this.#workspace, stdio: 'inherit' })

    return { bootstrap: () => this.#bootstrap() }
  }

  #bootstrap() {
    Logger.Wrap()
    Logger.Tips(`# Stage-BootstrapBenchmark`)

    // TODO 开启多线程 | 代码优化
    this.fixtures.forEach((fixture) => {
      const fixturePkgPath = join(this.#benchmarkConfig.cwd, fixture.dir, this.#benchmarkConfig.pkgFileName)
      Logger.Info('## retrieved pkgfile:', fixturePkgPath)

      this.#installers.forEach((installer) => {
        const runDir = join(this.#workspace, fixture.dir, installer.pm)
        const runPkgPath = join(runDir, this.#benchmarkConfig.pkgFileName)

        mkdirSync(runDir, { recursive: true })
        copyFileSync(fixturePkgPath, runPkgPath)

        // TODO Output SVG + JSON
        const records = this.#runTask(runDir, installer)
        console.log(records)
      })
    })
  }

  #runTask(runDir: string, installer: Installer) {
    const runEnv = IO.createEnv(this.#workspace)
    const { pm, commandVariables } = installer
    const benchmarkRecords: BenchmarkRecord[] = []

    const version = IO.detectPMVersion(pm, { cwd: runDir, env: runEnv })
    const parsedPMVersion = IO.streamToString(pm, `v${version}`)

    Logger.Wrap()
    Logger.Info(`## retrieved version:`, parsedPMVersion)

    const installCommandArgs = ['install', ...IO.normalizeArgs(this.#benchmarkConfig.registry, commandVariables)]
    Logger.Info(`## retrieved command:`, `${pm} ${installCommandArgs.join(' ')}`.trim())
    Logger.Info('## retrieved control:', '🤍 No | 🧡 Has')
    Logger.Wrap()

    /* ====================================================== benchmark ====================================================== */

    const runInstallPre = (cache: boolean, lockfile: boolean, node_modules: boolean) => {
      const cacheHeart = IO.createHeart(cache)
      const lockfileHeart = IO.createHeart(lockfile)
      const node_modulesHeart = IO.createHeart(node_modules)
      const mergedVariatesHeart = `${cacheHeart} cache | ${lockfileHeart} lockfile | ${node_modulesHeart} node_modules`

      Logger.Important(`## 👇 Control variates: ${mergedVariatesHeart}`)

      !cache && this.#cleanCache(runDir, commandVariables.cache.dir, commandVariables.store?.dir)
      !lockfile && this.#cleanLockFile(runDir, commandVariables.lockFileName)
      !node_modules && this.#cleanNodeModules(runDir)

      return mergedVariatesHeart
    }

    const runInstallGo = () => {
      Logger.Wrap()

      const TimeS = Date.now()
      IO.spawnSync(pm, installCommandArgs, { cwd: runDir, stdio: 'inherit' })
      const TimeE = Date.now()

      Logger.Wrap()

      return TimeE - TimeS
    }

    const runInstallPost = () => IO.statFolder(runDir)

    const runInstall = (cache: boolean, lockfile: boolean, node_modules: boolean): BenchmarkRecord => {
      const variates = runInstallPre(cache, lockfile, node_modules)
      const time = runInstallGo()
      const size = runInstallPost()

      Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} -> ${IO.byteToMiB(size)} | ${IO.msToSeconds(time)}`)
      Logger.Wrap()

      return { time, size, variates }
    }

    benchmarkRecords.push(runInstall(false, false, false))
    benchmarkRecords.push(runInstall(true, false, false))
    benchmarkRecords.push(runInstall(false, true, false))
    benchmarkRecords.push(runInstall(false, false, true))
    benchmarkRecords.push(runInstall(true, true, false))
    benchmarkRecords.push(runInstall(true, false, true))
    benchmarkRecords.push(runInstall(false, true, true))

    return benchmarkRecords
  }

  #cleanCache(runDir: string, cacheDir: string, storeDir?: string) {
    const mergedCacheDir = join(runDir, cacheDir)
    IO.cleanDir(mergedCacheDir, () => Logger.Info(`## clean cache:`, mergedCacheDir))

    // Soft and hard links exclusive
    if (!storeDir) return
    const mergedStoreDir = join(runDir, storeDir)
    IO.cleanDir(mergedStoreDir, () => Logger.Info(`## clean store:`, mergedStoreDir))
  }

  #cleanLockFile(runDir: string, lockFileName: PresetPMLockFileName) {
    const mergedDir = join(runDir, lockFileName)
    IO.cleanDir(mergedDir, () => Logger.Info(`## clean lockfile:`, mergedDir))
  }

  #cleanNodeModules(runDir: string) {
    const mergedDir = join(runDir, 'node_modules')
    IO.cleanDir(mergedDir, () => Logger.Info(`## clean node_modules:`, mergedDir))
  }
}
