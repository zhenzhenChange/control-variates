interface KD {
  /** @description 参数键 */
  key: string
  /** @description 目录值 */
  dir: string
}

interface Ignores {
  /** @description 忽略脚本执行的参数 */
  scripts: string
  /** @description 忽略引擎检查的参数 */
  engines?: string
  /** @description 忽略 PeerDeps 检查的参数 */
  strictPeerDependencies: string | string[]
}

// NOTE：提供 T 字面量类型支持的同时，也支持其它字面量值
type LiteralUnion<T extends string> = T | (string & Object)

export type PresetPM = LiteralUnion<'npm' | 'yarn' | 'pnpm'>
export type PresetPMMap = Record<PresetPM, 'add'>
export type PresetPMLockFileName = LiteralUnion<'yarn.lock' | 'pnpm-lock.yaml' | 'package-lock.json'>
export type PresetPMVersionArgName = LiteralUnion<'--version'>

export interface Config {
  /**
   * @default process.cwd
   * @description 当前工作目录
   */
  cwd?: string
  /**
   * @default 3
   * @description 测试轮数
   */
  rounds?: number
  /**
   * @default benchmark
   * @description 目录前缀
   */
  prefix?: string
  /**
   * @default https://registry.npmjs.org
   * @description 镜像源
   */
  registry?: string
  /**
   * @default false
   * @description 是否为多包仓库
   */
  monorepo?: boolean
  /**
   * @default false
   * @description 是否清理遗留产物
   */
  cleanLegacy?: boolean
  /**
   * @default package.json
   * @description 包描述文件名
   */
  pkgFileName?: string
  /**
   * @default false
   * @description 是否跳过包管理器的安装
   */
  skipPMInstall?: boolean
}

export interface Fixture {
  /** @description 资产路径 */
  dir: string
}

export interface Installer {
  /** @description 包管理器 */
  pm: PresetPM
  /**
   * @default latest
   * @description 版本
   */
  version?: LiteralUnion<'latest'>
  /** @description 命令参数 */
  commandVariables: InstallerVariables
}

export interface InstallerVariables {
  /** @description 专属于该包管理器的额外参数 */
  args?: string[]
  /** @description 缓存目录 */
  cache: KD
  /** @description 存储目录 */
  store?: KD
  /** @description 忽略参数 */
  ignores: Ignores
  /** @description 锁依赖版本文件名 */
  lockFileName: PresetPMLockFileName
}

export interface BenchmarkRecord {
  /** @description 跑分耗时 */
  time: number
  /** @description 磁盘占用 */
  size?: number
  /** @description 控制变量 */
  variates: string
}
