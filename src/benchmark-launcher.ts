import { BenchmarkConfig, BenchmarkFixture, BenchmarkInstallerMap } from './shared'

class BenchmarkLauncher {
  constructor(fixtures: BenchmarkFixture[]) {}

  use<T extends keyof BenchmarkInstallerMap>(pm: T, command: BenchmarkInstallerMap[T], commandArgs: string[] = []) {
    const shell = `${pm} ${command} ${commandArgs.join(' ')}`.trim()

    console.log(shell)

    return { config: (config: BenchmarkConfig) => this.#config(config) }
  }
j
  #config(config: BenchmarkConfig) {
    return { register: () => this.#register() }
  }

  #register() {
    return { bootstrap: () => this.#bootstrap() }
  }

  #bootstrap() {
    return { benchmarkDone: () => this.#benchmarkDone() }
  }

  #benchmarkDone() {}
}

new BenchmarkLauncher([
  { directory: './fixtures/angular' },
  { directory: './fixtures/webpack' },
  { directory: './fixtures/3dcat-website' },
  { directory: './fixtures/3dcat-public-bs' },
  { directory: './fixtures/3dcat-public-fs' },
])
  .use('npm', 'install')
  .config({ limit: 3, prefix: 'benchmark' })
  .register(/* 注册包管理器 */)
  .bootstrap(/* 引导启动 */)
  .benchmarkDone()
