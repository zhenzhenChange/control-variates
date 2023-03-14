import { v4 } from 'uuid'
import { join } from 'node:path'
import { rimrafSync } from 'rimraf'
import { mkdirSync, readdirSync } from 'node:fs'

import { getOSTmpDir, Logger } from './polyfill'

export async function setupPrepareWorkspace(workspacePrefix: string) {
  Logger.Tips(`2. Use ${workspacePrefix} as a workspace directory prefix...`)

  const osTmpDir = getOSTmpDir()
  await removeWorkspace(osTmpDir, workspacePrefix)
  return await createWorkspace(osTmpDir, workspacePrefix)
}

function removeWorkspace(osTmpDir: string, workspacePrefix: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      const cachedTmpDir = readdirSync(osTmpDir)
        .filter((dir) => dir.includes(workspacePrefix))
        .map((dir) => {
          const cachedDir = join(osTmpDir, dir)

          return cachedDir
        })

      if (cachedTmpDir.length) {
        Logger.Warn(`Discover workspace directory...`)
        cachedTmpDir.forEach((dir) => Logger.Warn(`workspace directory deleted: ${dir}`))
        rimrafSync(cachedTmpDir)
      }

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

function createWorkspace(osTmpDir: string, workspacePrefix: string) {
  return new Promise<string>((resolve, reject) => {
    try {
      Logger.Info(`Generate workspace directory...`)
      const workspaceTmpDir = join(osTmpDir, `${workspacePrefix}-${v4()}`)
      mkdirSync(workspaceTmpDir)
      Logger.Info(`workspace directory created: ${workspaceTmpDir}`)

      resolve(workspaceTmpDir)
    } catch (error) {
      reject(error)
    }
  })
}
