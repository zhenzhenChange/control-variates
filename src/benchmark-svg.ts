import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { BenchmarkResult } from './benchmark-shared'

// TODO Optimize
export function createSVGTemplate(documentTitle: string, benchmarkResults: BenchmarkResult[]) {
  return readFileSync(join(process.cwd(), 'SVG-Template.html'), { encoding: 'utf8' })
    .replace(/\{\{\s+documentTitle\s+\}\}/gi, documentTitle)
    .replace(/\{\{\s+benchmarkYAxis\s+\}\}/gi, JSON.stringify(benchmarkResults[0].records.map((record) => record.vars)))
    .replace(/\{\{\s+benchmarkResults\s+\}\}/gi, JSON.stringify(benchmarkResults))
}
