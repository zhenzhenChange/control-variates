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

export interface BenchmarkConfig {
  limit: number
  prefix: string
  registry?: string
  monorepo?: boolean
}

export interface BenchmarkFixture {
  directory: string
}

export interface BenchmarkInstallerMap {
  npm: 'install'
  yarn: 'add'
  pnpm: 'add'
}

export interface BenchmarkInstaller {
  pm: string
  version: string
  variables: SwitchVariables
}

export interface SwitchVariables {
  cache: string
  script: string
  peerDeps: string
  diagnosis: string
}
