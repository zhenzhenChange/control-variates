/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description 由于 Pnpm 的跑分代码扩展性太弱，故重写（部分逻辑参考 Pnpm Benchmarks 的实现）。
 */

import { Benchmark } from './benchmark'

new Benchmark([{ dir: './fixtures/example' }, { dir: './fixtures/playground' }])
  .use('pnpm', 'add')
  .config({ registry: 'https://registry.npm.taobao.org', cleanLegacy: true })
  .register([
    {
      pm: 'npm',
      commandVariables: {
        args: ['--no-fund', '--no-audit'],
        cache: {
          key: '--cache',
          dir: '.npm-cache',
        },
        ignores: {
          scripts: '--ignore-scripts',
          engines: '--ignore-engines',
          strictPeerDependencies: '--legacy-peer-deps',
        },
        lockFileName: 'package-lock.json',
      },
    },
    {
      pm: 'yarn',
      commandVariables: {
        args: ['--no-fund', '--no-audit'],
        cache: {
          key: '--cache-folder',
          dir: '.yarn-cache',
        },
        ignores: {
          scripts: '--ignore-scripts',
          engines: '--ignore-engines',
          strictPeerDependencies: '--ignore-optional', // Can you ignore peer deps ?
        },
        lockFileName: 'yarn.lock',
      },
    },
    {
      pm: 'pnpm',
      commandVariables: {
        cache: {
          key: '--cache-dir',
          dir: '.pnpm-cache',
        },
        store: {
          key: '--store-dir',
          dir: '.pnpm-store',
        },
        ignores: {
          scripts: '--ignore-scripts',
          strictPeerDependencies: '--no-strict-peer-dependencies',
        },
        lockFileName: 'pnpm-lock.yaml',
      },
    },
  ])
  .bootstrap()
