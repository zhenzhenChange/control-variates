import { Installer, PM } from './shared'
import { Logger, spawnSync } from './polyfill'

export async function setupPrepareInstaller(pm: PM, installers: Installer[], workspaceTmpDir: string) {
  Logger.Tips(`3. Install Package Manager...`)
  const normalizedInstallers = installers.map(({ name, version }) => `${name}@${version}`)
  Logger.Info(`${pm} is about to install the following package managers: ${normalizedInstallers.join(', ')}`)
  console.log('\r')

  spawnSync(pm, ['init'], { cwd: workspaceTmpDir })
  spawnSync(pm, ['add', '-D', ...normalizedInstallers], { cwd: workspaceTmpDir, stdio: 'inherit' })
}
