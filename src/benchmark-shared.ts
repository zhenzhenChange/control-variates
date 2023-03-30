export interface KD {
  /** @description 参数键 */
  key: string
  /** @description 目录值 */
  dir: string
}

interface Ignores {
  /** @description 忽略脚本执行的参数 */
  scripts?: string
  /** @description 忽略引擎检查的参数 */
  engines?: string
  /** @description 忽略对等依赖严格检查的参数 */
  strictPeerDependencies?: string | string[]
}

// NOTE：提供 T 字面量类型支持的同时，也支持其它字符串字面量值
type LiteralUnion<T extends string> = T | (string & Object)

export type PresetPM = LiteralUnion<'npm' | 'yarn' | 'pnpm'>
export type PresetPMMap = Record<PresetPM, 'add'>
export type PresetPMRegistry = LiteralUnion<'https://registry.npmjs.org/' | 'https://registry.npm.taobao.org/'>
export type PresetPMRcFileName = LiteralUnion<'.npmrc' | '.yarnrc'>
export type PresetPMLockFileName = LiteralUnion<'yarn.lock' | 'pnpm-lock.yaml' | 'package-lock.json'>
export type PresetPMVersionArgName = LiteralUnion<'--version'>

export class PMCommandArgs {
  /**
   * @default []
   * @description 初始化命令的额外参数
   */
  initCommandArgs: string[]
  /**
   * @default []
   * @description 安装命令的额外参数
   */
  installCommandArgs: string[]

  constructor(args?: Partial<PMCommandArgs>) {
    this.initCommandArgs = args?.initCommandArgs ?? []
    this.installCommandArgs = args?.installCommandArgs ?? []
  }
}

export interface Fixture {
  /** @description 资产路径 */
  dir: string
  /** @description 资产命名 @default fixture.index */
  name?: string
}

export interface Installer {
  /** @description 包管理器 */
  pm: PresetPM
  /** @description 版本 @default latest */
  version?: LiteralUnion<'latest'>
  /** @description 锁依赖版本文件名 */
  lockFileName: PresetPMLockFileName
  /** @description 命令参数 */
  commandVariables?: InstallerVariables
}

export interface InstallerVariables {
  /** @description 专属于该包管理器的额外参数 */
  args?: string[]
  /** @description 忽略参数 */
  ignores?: Ignores
  /** @description 各类构建之后的存储/缓存目录 */
  productDirs?: KD[]
}

export class BenchmarkConfig {
  static readonly DIRECTORY = 'pm_benchmarks'
  static readonly PKG_FILE_NAME = 'package.json'

  /**
   * @default process.cwd()
   * @description 当前工作目录
   */
  cwd: string

  /**
   * @default 3
   * @description 测试轮数
   */
  rounds: number

  /**
   * @default https://registry.npmjs.org/
   * @description 镜像源
   */
  registry: PresetPMRegistry

  /**
   * @default false
   * @description 是否为多包仓库
   */
  monorepo: boolean

  /**
   * @default false
   * @description 是否清理遗留产物
   */
  cleanLegacy: boolean

  /**
   * @default false
   * @description 是否跳过包管理器的安装（Debug Only）
   */
  skipPMInstall: boolean

  constructor(config?: Partial<BenchmarkConfig>) {
    this.cwd = config?.cwd ?? process.cwd()
    this.rounds = config?.rounds ?? 3
    this.registry = config?.registry ?? 'https://registry.npmjs.org/'
    this.monorepo = config?.monorepo ?? false
    this.cleanLegacy = config?.cleanLegacy ?? false
    this.skipPMInstall = config?.skipPMInstall ?? false
  }
}

export interface BenchmarkResult {
  /** @description 包管理器 */
  pm: PresetPM
  /** @description 安装版本 */
  version: string
  /** @description 结果记录 */
  records: BenchmarkRecord[]
}

export interface BenchmarkRecord {
  /** @description 跑分耗时（ms） */
  time: number
  /** @description 磁盘占用（byte） */
  size: number
  /** @description 控制变量 */
  variates: string
}
