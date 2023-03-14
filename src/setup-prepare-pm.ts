import { decode } from 'iconv-lite'

import { PM } from './shared'
import { Logger, spawnSync } from './polyfill'

const ICONV_ENCODING = 'cp936'
const STDIO_ENCODING: BufferEncoding = 'binary'

/** @description Solving the Chinese garbled code problem. */
const decodeStdio = (stdio: string) => decode(Buffer.from(stdio, STDIO_ENCODING), ICONV_ENCODING).replace(/\r\n/g, '').trim()

export function setupPreparePM(pm: PM) {
  return new Promise<void>((resolve, reject) => {
    Logger.Tips(`1. Use ${pm} to install other package managers...`)

    const result = spawnSync(pm, ['--version'], { encoding: STDIO_ENCODING })

    if (result.error) {
      Logger.Error(`The package manager [${pm}] may not be installed.`)
      console.log('\r')
      reject(new Error(decodeStdio(result.stderr)))
    } else {
      Logger.Info(`${pm} version: v${decodeStdio(result.stdout)}`)
      resolve()
    }
  })
}
