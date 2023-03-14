import { BenchmarkConfig, BenchmarkFixture, BenchmarkPM, BenchmarkPMCommand } from './shared'

class BenchmarkLauncher {
  constructor(fixtures: BenchmarkFixture[]) {}

  use(pm: BenchmarkPM, command: BenchmarkPMCommand, commandArgs: string[] = []) {
    return { config: (config: BenchmarkConfig) => this.#config(config) }
  }

  #config(config: BenchmarkConfig) {
    return { register: () => this.#register() }
  }

  #register() {
    return { bootstrap: () => this.#bootstrap() }
  }

  #bootstrap() {}
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
