/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description Reference to Pnpm implementation.
 */

import { Benchmark } from './benchmark'

new Benchmark([
  { dir: './fixtures/angular' },
  { dir: './fixtures/webpack' },
  { dir: './fixtures/3dcat-website' },
  { dir: './fixtures/3dcat-public-bs' },
  { dir: './fixtures/3dcat-public-fs' },
  { dir: './fixtures/playground' },
])
  .use('pnpm', 'add')
  .config({ cwd: process.cwd(), prefix: 'benchmark', cleanCache: true })
  .register([
    {
      pm: 'npm',
      commandArgs: ['--no-fund', '--no-audit', '--ignore-scripts', '--legacy-peer-deps', '--cache=.npm-cache'],
    },
    {
      pm: 'yarn',
      commandArgs: [],
    },
    {
      pm: 'pnpm',
      commandArgs: [
        '--ignore-scripts',
        '--no-strict-peer-dependencies',
        '--cache-dir=.pnpm-cache',
        '--store-dir=.pnpm-store',
      ],
    },
  ])
  .bootstrap()
