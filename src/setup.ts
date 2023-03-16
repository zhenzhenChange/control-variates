/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description Reference to Pnpm implementation.
 */

import { Benchmark } from './benchmark'

// NOTE：受限于机器性能，目前仅支持同步模式，此阶段建议只对单一项目进行测试

// NOTE：若 package.json 中的依赖过多，当使用 Pnpm 进行安装时，若机器性能较弱，磁盘占用率长时间处于 100%，可能会导致操作系统卡死
// NOTE：初步猜测可能是 babel 的一些 PeerDeps 或 @parcel/transformer-js （体积达到 45MB）导致的，但具体原因尚未可知（下载阻塞？软硬链接失败？）

new Benchmark([{ dir: './fixtures/playground' }])
  .use('pnpm', 'add')
  .config({ cleanCache: true })
  .register([
    {
      pm: 'npm',
      commandArgs: [
        '--no-fund',
        '--no-audit',
        '--legacy-peer-deps',
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
