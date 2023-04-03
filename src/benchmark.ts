import { join } from 'node:path'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'

import { IO } from './benchmark-io'
import { Logger } from './benchmark-logger'
import { createSVGTemplate } from './benchmark-svg'
import {
  BenchmarkConfig,
  BenchmarkRecord,
  BenchmarkResult,
  Fixture,
  Installer,
  InstallerRuntimeConfig,
  PMCommandArgs,
  PresetPMLockFileName,
  PresetPMMap,
} from './benchmark-shared'

export class Benchmark {
  #shellPM: string
  #shellPMCommand: string
  #shellPMCommandArgs: PMCommandArgs

  #workspace: string
  #installers: Installer[]
  #benchmarkConfig: BenchmarkConfig

  constructor(private fixtures: Fixture[]) {}

  use<T extends keyof PresetPMMap>(pm: T, command: PresetPMMap[T], commandArgs?: Partial<PMCommandArgs>) {
    const shellPMCommandArgs = new PMCommandArgs(commandArgs)

    Logger.Tips(`# Stage-PreparePM`)
    Logger.Info(`## detect version:`, IO.streamToString(pm, `v${IO.detectPMVersion(pm)}`))
    Logger.Info(`## detect command:`, IO.streamToString(pm, command, ...shellPMCommandArgs.installCommandArgs))

    this.#shellPM = pm
    this.#shellPMCommand = command
    this.#shellPMCommandArgs = shellPMCommandArgs

    return { config: (config?: Partial<BenchmarkConfig>) => this.#config(config) }
  }

  #config(config?: Partial<BenchmarkConfig>) {
    Logger.Wrap()

    const { cwd, cleanLegacy } = (this.#benchmarkConfig = new BenchmarkConfig(config))

    Logger.Tips(`# Stage-PrepareWorkSpace`)
    Logger.Info(`## deploy workspace:`, cwd)
    Logger.Info(`## deploy directory:`, BenchmarkConfig.DIRECTORY)

    cleanLegacy && IO.removeWorkSpace(cwd, BenchmarkConfig.DIRECTORY)
    this.#workspace = IO.createWorkSpace(cwd, BenchmarkConfig.DIRECTORY)

    return { register: (installers: Installer[]) => this.#register(installers) }
  }

  #register(installers: Installer[]) {
    Logger.Wrap()
    Logger.Tips(`# Stage-PrepareInstallers`)

    this.#installers = installers

    IO.spawnSync(this.#shellPM, ['init', ...this.#shellPMCommandArgs.initCommandArgs], { cwd: this.#workspace })
    Logger.Info(`## create pkgfile:`, join(this.#workspace, BenchmarkConfig.PKG_FILE_NAME))

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
      const fixturePkgPath = join(fixtureDir, BenchmarkConfig.PKG_FILE_NAME)
      Logger.Info('## retrieved pkgfile:', fixturePkgPath)

      const results = this.#installers.map((installer) => {
        const runDir = join(this.#workspace, `run-${fixture.name ?? i}-${installer.pm}`)
        const runPkgPath = join(runDir, BenchmarkConfig.PKG_FILE_NAME)

        mkdirSync(runDir, { recursive: true })
        copyFileSync(fixturePkgPath, runPkgPath)

        this.#createRc(runDir, installer.runtimeConfig)

        return this.#runTask(runDir, installer)
      })

      const outputDir = join(this.#workspace, `run-${fixture.name ?? i}-results`)
      mkdirSync(outputDir, { recursive: true })

      const outputHTMLDir = join(outputDir, 'benchmark.html')
      const outputJSONDir = join(outputDir, 'benchmark.json')
      writeFileSync(outputJSONDir, JSON.stringify(results, null, 2))
      writeFileSync(outputHTMLDir, createSVGTemplate(`${fixture.name ?? fixture.dir}-${this.#benchmarkConfig.registry}`, results))

      Logger.Finally(`## ${fixture.dir} benchmark done.`)
      Logger.Finally(`## output JSON directory: ${outputJSONDir}`)
      Logger.Finally(`## output HTML directory: ${outputHTMLDir}`)
      Logger.Wrap()
    })
  }

  #runTask(runDir: string, installer: Installer): BenchmarkResult {
    const runEnv = IO.createEnv(this.#workspace)
    const { pm, lockFileName } = installer

    const version = IO.detectPMVersion(pm, { cwd: runDir, env: runEnv })
    const parsedPMVersion = IO.streamToString(pm, `v${version}`)

    Logger.Wrap()
    Logger.Info(`## retrieved version:`, parsedPMVersion)
    Logger.Info('## retrieved control:', '🤍 No | 🧡 Has')
    Logger.Wrap()

    /* ====================================================== benchmark ====================================================== */

    const runInstallPre = (cache: boolean, lockfile: boolean, node_modules: boolean) => {
      const cacheHeart = IO.createHeart(cache)
      const lockfileHeart = IO.createHeart(lockfile)
      const node_modulesHeart = IO.createHeart(node_modules)
      const mergedVariatesHeart = `${cacheHeart} cache | ${lockfileHeart} lockfile | ${node_modulesHeart} node_modules`

      Logger.Important(`## 👇 Control variates: ${mergedVariatesHeart}`)

      !cache && installer.cacheCleaner(pm)
      !lockfile && this.#cleanLockFile(runDir, lockFileName)
      !node_modules && this.#cleanNodeModules(runDir)

      return mergedVariatesHeart
    }

    const runInstallPost = () => IO.statFolder(runDir)

    const runInstallProcess = () => {
      Logger.Wrap()

      const TimeS = Date.now()
      IO.spawnSync(pm, ['install'], { env: runEnv, cwd: runDir, stdio: 'inherit' })
      const TimeE = Date.now()

      Logger.Wrap()

      return TimeE - TimeS
    }

    const runInstall = (cache: boolean, lockfile: boolean, node_modules: boolean): BenchmarkRecord => {
      const vars = runInstallPre(cache, lockfile, node_modules)
      const time = runInstallProcess()
      const size = runInstallPost()

      Logger.Important(`## 👆 Time consuming: ${parsedPMVersion} -> ${IO.byteToMiB(size)} | ${IO.msToSeconds(time)}`)
      Logger.Wrap()

      return { time, size, vars }
    }

    return {
      pm,
      version,
      records: [
        runInstall(false, false, false),
        runInstall(true, true, true),
        runInstall(true, false, false),
        runInstall(false, true, false),
        runInstall(false, false, true),
        runInstall(true, true, false),
        runInstall(true, false, true),
        runInstall(false, true, true),
      ],
    }
  }

  #createRc(runDir: string, runtimeConfig: InstallerRuntimeConfig) {
    const lineBreak = '\r\n'
    const { pairs, delimiter, filename } = runtimeConfig

    const registry = `registry${delimiter}${this.#benchmarkConfig.registry}`
    const normalizedPairs = [registry, ...pairs.map(({ key, val }) => `${key}${delimiter}${val}`)]

    writeFileSync(join(runDir, filename), `${normalizedPairs.join(lineBreak)}${lineBreak}`)
  }

  #cleanLockFile(runDir: string, lockFileName: PresetPMLockFileName) {
    const mergedDir = join(runDir, lockFileName)
    IO.cleanDir(mergedDir, () => Logger.Info(`## clean lockfile:`, mergedDir))
  }

  #cleanNodeModules(runDir: string) {
    const mergedDir = join(runDir, BenchmarkConfig.NODE_MODULES)
    IO.cleanDir(mergedDir, () => Logger.Info(`## clean node_modules:`, mergedDir))
  }
}
