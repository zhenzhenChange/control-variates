/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description 由于 Pnpm 的跑分代码扩展性太弱，故重写（部分逻辑参考 Pnpm Benchmarks 的实现）。
 */

import { Benchmark } from './benchmark'

new Benchmark([
  { dir: './fixtures/example', name: 'example' },
  { dir: './fixtures/playground', name: 'playground' },
])
  .use('pnpm', 'add')
  .config({ cleanLegacy: true })
  .register([
    {
      pm: 'npm',
      lockFileName: 'package-lock.json',
      commandVariables: {
        args: ['--no-fund', '--no-audit'],
        ignores: {
          scripts: '--ignore-scripts',
          engines: '--ignore-engines',
          strictPeerDependencies: '--legacy-peer-deps',
        },
        productDirs: [{ key: '--cache', dir: '.npm-cache' }],
      },
    },
    {
      pm: 'yarn',
      lockFileName: 'yarn.lock',
      commandVariables: {
        args: ['--no-fund', '--no-audit'],
        ignores: {
          scripts: '--ignore-scripts',
          engines: '--ignore-engines',
          strictPeerDependencies: '--ignore-optional', // Can you ignore peer deps ?
        },
        productDirs: [{ key: '--cache-folder', dir: '.yarn-cache' }],
      },
    },
    {
      pm: 'pnpm',
      lockFileName: 'pnpm-lock.yaml',
      commandVariables: {
        ignores: {
          scripts: '--ignore-scripts',
          strictPeerDependencies: '--no-strict-peer-dependencies',
        },
        productDirs: [
          { key: '--cache-dir', dir: '.pnpm-cache' },
          { key: '--store-dir', dir: '.pnpm-store' },
          { key: '--virtual-store-dir', dir: '.pnpm-virtual-store' },
        ],
      },
    },
  ])
  .bootstrap()
