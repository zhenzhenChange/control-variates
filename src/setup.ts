/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @see https://github.com/yarnpkg/berry/blob/master/scripts/bench-run.sh
 */

import { rimrafSync } from 'rimraf'
import { join, resolve } from 'node:path'

import { IO } from './benchmark-io'
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
      cacheCleaner: (pm) => {
        IO.spawnSync(pm, ['config', 'get', 'cache'], { stdio: 'inherit' })
        IO.spawnSync(pm, ['cache', 'clean', '--force'], { stdio: 'inherit' })
      },
      runtimeConfig: {
        pairs: [
          { key: 'ignore-scripts', val: true },
          { key: 'legacy-peer-deps', val: true },
        ],
        filename: '.npmrc',
        delimiter: ' = ',
      },
    },
    {
      pm: 'yarn',
      lockFileName: 'yarn.lock',
      cacheCleaner: (pm) => {
        IO.spawnSync(pm, ['cache', 'dir'], { stdio: 'inherit' })
        IO.spawnSync(pm, ['cache', 'clean'], { stdio: 'inherit' })
      },
      runtimeConfig: {
        pairs: [{ key: 'ignore-scripts', val: true }],
        filename: '.yarnrc',
        delimiter: ': ',
      },
    },
    {
      pm: 'pnpm',
      lockFileName: 'pnpm-lock.yaml',
      cacheCleaner: (pm) => {
        const storeDir = IO.spawnSync(pm, ['store', 'path'], { encoding: 'utf-8' })
        rimrafSync(resolve(storeDir.stdout.trim()))

        const cacheDir = join(process.env['LOCALAPPDATA']!, 'pnpm-cache')
        rimrafSync(cacheDir)
      },
      runtimeConfig: {
        pairs: [
          { key: 'ignore-scripts', val: true },
          { key: 'strict-peer-dependencies', val: false },
        ],
        filename: '.npmrc',
        delimiter: ' = ',
      },
    },
  ])
  .bootstrap()
