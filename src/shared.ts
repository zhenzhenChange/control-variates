type LiteralUnion<T> = T | (string & Object)

export type PM = LiteralUnion<'npm' | 'yarn' | 'pnpm'>
export type PMCommand = LiteralUnion<'add' | 'install'>

export interface Installer {
  name: PM
  version: LiteralUnion<'latest'>
}

export interface SetupConfig {
  /** @description Use this package manager to install other package managers */
  pm: PM
  installers: Installer[]
  /** @description Workspace temporary directory prefix */
  workspacePrefix: string
}

/* ========================================= */

export type BenchmarkPM = LiteralUnion<'npm' | 'yarn' | 'pnpm'>
export type BenchmarkPMCommand = LiteralUnion<'add' | 'install'>

export interface BenchmarkConfig {
  limit: number
  prefix: string
  registry?: string
  monorepo?: boolean
}

export interface BenchmarkFixture {
  directory: string
}
