import { join } from 'node:path'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'

import { IO } from './benchmark-io'
import { Logger } from './benchmark-logger'
import { createSVGTemplate } from './benchmark-svg'
import { BenchmarkRecord, BenchmarkResult, Config, Fixture, Installer, PresetPMLockFileName, PresetPMMap } from './benchmark-shared'

class PMCommandArgs {
  initCommandArgs: string[]
  installCommandArgs: string[]

  constructor(args?: Partial<PMCommandArgs>) {
    this.initCommandArgs = args?.initCommandArgs ?? []
    this.installCommandArgs = args?.installCommandArgs ?? []
  }
}

class ConfigFactory implements Required<Config> {
  static readonly directory = 'node_benchmarks'
  static readonly pkgFileName = 'package.json'

  cwd = process.cwd()
  rounds = 3
  registry = 'https://registry.npmjs.org'
  monorepo = false
  cleanLegacy = false
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
    const shellPMCommandArgs = new PMCommandArgs(commandArgs)

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
    const { cwd, cleanLegacy } = this.#benchmarkConfig

    Logger.Tips(`# Stage-PrepareWorkSpace`)
    Logger.Info(`## deploy workspace:`, cwd)
    Logger.Info(`## deploy directory:`, ConfigFactory.directory)

    cleanLegacy && IO.removeWorkSpace(cwd, ConfigFactory.directory)
    this.#workspace = IO.createWorkSpace(cwd, ConfigFactory.directory)

    return { register: (installers: Installer[]) => this.#register(installers) }
  }

  #register(installers: Installer[]) {
    Logger.Wrap()
    Logger.Tips(`# Stage-PrepareInstallers`)

    this.#installers = installers

    IO.spawnSync(this.#shellPM, ['init', ...this.#shellPMCommandArgs.initCommandArgs], { cwd: this.#workspace, stdio: 'inherit' })
    Logger.Info(`## create pkgfile:`, join(this.#workspace, ConfigFactory.pkgFileName))

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

    // TODO 开启多线程
    this.fixtures.forEach((fixture, i) => {
      const fixtureDir = join(this.#benchmarkConfig.cwd, fixture.dir)
      const fixturePkgPath = join(fixtureDir, ConfigFactory.pkgFileName)
      Logger.Info('## retrieved pkgfile:', fixturePkgPath)

      const results = this.#installers.map((installer) => {
        const runDir = join(this.#workspace, `run-${installer.pm}-${i}`)
        const runPkgPath = join(runDir, ConfigFactory.pkgFileName)

        mkdirSync(runDir, { recursive: true })
        copyFileSync(fixturePkgPath, runPkgPath)

        return this.#runTask(runDir, installer)
      })

      const outputDir = join(this.#workspace, `run-results-${i}`)
      const outputHTMLDir = join(outputDir, 'benchmark.html')
      const outputJSONDir = join(outputDir, 'benchmark.json')
      writeFileSync(outputJSONDir, JSON.stringify(results, null, 2))
      writeFileSync(outputHTMLDir, createSVGTemplate(fixture.dir, results))

      Logger.Finally(`## ${fixture.dir} benchmark done.`)
      Logger.Finally(`## output JSON directory: ${outputJSONDir}`)
      Logger.Finally(`## output HTML directory: ${outputHTMLDir}`)
      Logger.Wrap()
    })
  }

  #runTask(runDir: string, installer: Installer): BenchmarkResult {
    const runEnv = IO.createEnv(this.#workspace)
    const { pm, commandVariables } = installer

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

    return {
      pm,
      version,
      records: [
        runInstall(false, false, false),
        runInstall(true, false, false),
        runInstall(false, true, false),
        runInstall(false, false, true),
        runInstall(true, true, false),
        runInstall(true, false, true),
        runInstall(false, true, true),
      ],
    }
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
