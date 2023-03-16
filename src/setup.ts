/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description Reference to Pnpm implementation.
 */

import { Benchmark } from './benchmark'

new Benchmark([
  // NOTE：受限于机器性能，目前仅支持同步模式，此阶段建议只对单一项目进行测试
  // { dir: './fixtures/angular' },
  // { dir: './fixtures/webpack' },
  // { dir: './fixtures/3dcat-website' },
  // { dir: './fixtures/3dcat-public-bs' },
  // { dir: './fixtures/3dcat-public-fs' },
  { dir: './fixtures/playground' },
])
  .use('pnpm', 'add')
  .config({ cleanCache: true })
  .register([
    {
      pm: 'npm',
      commandArgs: [
        '--no-fund',
        '--no-audit',
        '--no-strict-peer-deps',
        '--ignore-scripts',
        '--ignore-engines',
        '--cache=.npm-cache',
      ],
    },
    {
      pm: 'yarn',
      commandArgs: [
        '--no-fund',
        '--no-audit',
        '--ignore-scripts',
        '--ignore-engines',
        '--ignore-optional', // Can you ignore peer deps ?
        '--cache-folder=.yarn-cache',
      ],
    },
    {
      pm: 'pnpm',
      commandArgs: [
        '--no-strict-peer-dependencies',
        '--ignore-scripts',
        '--cache-dir=.pnpm-cache',
        '--store-dir=.pnpm-store',
      ],
    },
  ])
  .bootstrap()
