type literalUnion<T> = T | (string & Object)

export type PM = literalUnion<'npm' | 'yarn' | 'pnpm'>

export interface Installer {
  name: PM
  version: literalUnion<'latest'>
}

export interface SetupConfig {
  /** @description Use this package manager to install other package managers */
  pm: PM
  installers: Installer[]
  /** @description Workspace temporary directory prefix */
  workspacePrefix: string
}
