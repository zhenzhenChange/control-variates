import { join } from 'node:path'
import { platform } from 'node:os'
import { readFileSync } from 'node:fs'

import { BenchmarkResult } from './benchmark-shared'

const getOS = () => {
  switch (platform()) {
    case 'linux':
      return 'Linux'

    case 'win32':
      return 'Windows'

    case 'darwin':
      return 'MacOS'

    default:
      return `Unknown OS: ${platform()}`
  }
}

// TODO Optimize
export function createSVGTemplate(documentTitle: string, benchmarkResults: BenchmarkResult[]) {
  return readFileSync(join(process.cwd(), 'SVG-Template.html'), { encoding: 'utf8' })
    .replace(/\{\{\s+documentTitle\s+\}\}/gi, `${documentTitle}-${getOS()}`)
    .replace(/\{\{\s+benchmarkYAxis\s+\}\}/gi, JSON.stringify(benchmarkResults[0].records.map((record) => record.vars)))
    .replace(/\{\{\s+benchmarkResults\s+\}\}/gi, JSON.stringify(benchmarkResults))
}
