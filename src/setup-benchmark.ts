import { join } from 'node:path'
import { copyFileSync, mkdirSync } from 'node:fs'

import { Installer } from './shared'
import { Logger, spawnSync } from './polyfill'

const FIXTURE_DIR = '/fixtures/3dcat-public-fs'
const PACKAGE_FILE_NAME = 'package.json'

export function setupBenchmark(installers: Installer[], workspaceTmpDir: string) {
  installers.map(({ name }) => name).forEach(run)

  function run(installer: string) {
    Logger.Tips(`### Execute install command: ${installer}`)
    console.log('\r')

    const runDir = join(workspaceTmpDir, FIXTURE_DIR, installer)
    const fileDir = join(process.cwd(), FIXTURE_DIR, PACKAGE_FILE_NAME)
    const runFileDir = join(runDir, PACKAGE_FILE_NAME)
    console.log('RunDir: ', runDir)
    console.log('FileDir: ', fileDir)
    console.log('RunFileDir: ', runFileDir)

    mkdirSync(runDir, { recursive: true })
    copyFileSync(fileDir, runFileDir)

    const TimeS = Date.now()
    spawnSync(installer, ['install', '--ignore-scripts'], { cwd: runDir, stdio: 'inherit' })
    const TimeE = Date.now()

    console.log('\r')
    Logger.Info(`### Time consuming: ${TimeE - TimeS}`)
  }
}
