type LiteralUnion<T> = T | (string & Object)

export type PresetPM = LiteralUnion<'npm' | 'yarn' | 'pnpm'>

export interface Config {
  cwd?: string
  limit?: number
  prefix?: string
  registry?: string
  monorepo?: boolean
  cleanCache?: boolean
  pkgFileName?: string
  skipPMInstall?: boolean
}

export interface Fixture {
  dir: string
}

export interface PresetPMMap {
  npm: 'install'
  yarn: 'add'
  pnpm: 'add'
}

export interface Installer {
  pm: PresetPM
  version?: LiteralUnion<'latest'>
  variables?: SwitchVariables
  commandArgs?: string[]
}

export interface SwitchVariables {
  cache: string
  script: string
  peerDeps: string
  diagnosis: string
}
