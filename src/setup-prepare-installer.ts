import { Installer, PM } from './shared'
import { Logger, spawnSync } from './polyfill'

export async function setupPrepareInstaller(pm: PM, installers: Installer[], workspaceTmpDir: string) {
  Logger.Tips(`3. Install Package Manager...`)
  const normalizedInstallers = installers.map(({ name, version }) => `${name}@${version}`)
  Logger.Info(`${pm} is about to install the following package managers: ${normalizedInstallers.join(', ')}`)
  console.log('\r')

  spawnSync(pm, ['init'], { cwd: workspaceTmpDir })
  spawnSync(pm, ['add', '-D', ...normalizedInstallers], { cwd: workspaceTmpDir, stdio: 'inherit' })
  console.log('\r')

  run(installers)
}

function run(installers: Installer[]) {
  const pms = installers.map(({ name }) => name)

  Logger.Tips(`### Execute install command: ${pms[0]} i --ignore-scripts`)
  console.log('\r')

  const s = Date.now()
  spawnSync(pms[0], ['i', '--ignore-scripts'], { cwd: './fixtures/3dcat-public-fs', stdio: 'inherit' })
  const e = Date.now()

  console.log('\r')
  Logger.Info(`### Time consuming: ${e - s}`)
}
