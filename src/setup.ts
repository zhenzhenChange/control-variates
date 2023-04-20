/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @see https://github.com/yarnpkg/berry/blob/master/scripts/bench-run.sh
 */

import { rimrafSync } from 'rimraf'

import { IO } from './benchmark-io'
import { Logger } from './benchmark-logger'
import { Benchmark } from './benchmark'

new Benchmark([
  { dir: './fixtures/angular', name: 'angular' },
  { dir: './fixtures/example', name: 'example' },
  { dir: './fixtures/playground', name: 'playground' },
])
  .use('pnpm', 'add')
  .config({ cleanLegacy: true, dynamicDepDir: './fixtures/dynamic-package.json' })
  .register([
    {
      pm: 'npm',
      lockFileName: 'package-lock.json',
      cacheCleaner: (pm) => {
        Logger.Info('## clean cache:', IO.execShell(pm, ['config', 'get', 'cache']))

        IO.spawnSync(pm, ['cache', 'clean', '--force'])
      },
      // https://docs.npmjs.com/cli/v9/using-npm/config
      runtimeConfig: {
        pairs: [
          { key: 'fund', val: false },
          { key: 'audit', val: false },
          { key: 'ignore-scripts', val: true },
          { key: 'legacy-peer-deps', val: true },
          { key: 'child-concurrency', val: 5 },
          { key: 'network-concurrency', val: 16 },
        ],
        filename: '.npmrc',
        delimiter: ' = ',
      },
    },
    {
      pm: 'yarn',
      lockFileName: 'yarn.lock',
      cacheCleaner: (pm) => {
        Logger.Info('## clean cache:', IO.execShell(pm, ['cache', 'dir']))

        IO.spawnSync(pm, ['cache', 'clean'])
      },
      // @see https://classic.yarnpkg.com/en/docs/yarnrc
      runtimeConfig: {
        pairs: [
          { key: 'ignore-scripts', val: true },
          { key: 'child-concurrency', val: 5 },
          { key: 'network-concurrency', val: 16 },
        ],
        filename: '.yarnrc',
        delimiter: ': ',
      },
    },
    {
      pm: 'pnpm',
      lockFileName: 'pnpm-lock.yaml',
      cacheCleaner: (pm) => {
        const storeDir = IO.execShell(pm, ['store', 'path'])
        Logger.Info('## clean store:', storeDir)
        rimrafSync(storeDir)

        const cacheDir = IO.getPnpmCachePath()
        Logger.Info('## clean cache:', cacheDir)
        rimrafSync(cacheDir)
      },
      // @see https://pnpm.io/npmrc
      runtimeConfig: {
        pairs: [
          { key: 'ignore-scripts', val: true },
          { key: 'strict-peer-dependencies', val: false },
          { key: 'child-concurrency', val: 5 },
          { key: 'network-concurrency', val: 16 },
        ],
        filename: '.npmrc',
        delimiter: ' = ',
      },
    },
  ])
  .bootstrap()
