/**
 * @see https://github.com/pnpm/pnpm.github.io/tree/main/benchmarks
 * @description Reference Pnpm
 */

import { Logger } from './polyfill'
import { SetupConfig } from './shared'
import { setupPreparePM } from './setup-prepare-pm'
import { setupPrepareWorkspace } from './setup-prepare-workspace'
import { setupPrepareInstaller } from './setup-prepare-installer'

export async function setup(options: SetupConfig) {
  const { pm, installers, workspacePrefix } = options

  await setupPreparePM(pm)
  console.log('\r')
  const workspaceTmpDir = await setupPrepareWorkspace(workspacePrefix)
  console.log('\r')
  await setupPrepareInstaller(pm, installers, workspaceTmpDir)
  console.log('\r')
}

setup({
  pm: 'pnpm',
  installers: [
    { name: 'npm', version: 'latest' },
    { name: 'yarn', version: 'latest' },
    { name: 'pnpm', version: 'latest' },
  ],
  workspacePrefix: 'control-variates',
})
  .then(() => Logger.Tips('Benchmark done.'))
  .catch(console.log)
