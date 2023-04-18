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

export class BenchmarkConfig {
  static readonly NODE_MODULES = 'node_modules'
  static readonly PKG_FILE_NAME = 'package.json'

  /**
   * @default process.cwd()
   * @description 当前工作目录
   *
   * ---
   *
   * 以此为起点路径，用于：
   * - `fixture`寻址
   * - `dynamic`寻址
   * - `workspace`创建/删除
   */
  cwd: string

  /**
   * @default 3
   * @description 执行轮数
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
   * @description 是否清理过往的遗留产物
   */
  cleanLegacy: boolean

  /**
   * @default null
   * @description 动态依赖内容路径
   */
  dynamicDepDir: string | null

  /**
   * @default false
   * @description 是否跳过包管理器的安装（Debug Only）
   */
  skipPMInstall: boolean

  /**
   * @default node_benchmarks
   * @description 工作空间前缀（同时也会将此前缀添加到`.gitignore`中）
   */
  workspacePrefix: string

  constructor(config?: Partial<BenchmarkConfig>) {
    this.cwd = config?.cwd ?? process.cwd()
    this.rounds = config?.rounds ?? 3
    this.registry = config?.registry ?? 'https://registry.npmjs.org/'
    this.monorepo = config?.monorepo ?? false
    this.cleanLegacy = config?.cleanLegacy ?? false
    this.dynamicDepDir = config?.dynamicDepDir ?? null
    this.skipPMInstall = config?.skipPMInstall ?? false
    this.workspacePrefix = config?.workspacePrefix ?? 'node_benchmarks'
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
  /** @description 锁文件名 */
  lockFileName: PresetPMLockFileName
  /** @description 缓存清理器 */
  cacheCleaner: (pm: PresetPM) => void
  /** @description 运行时配置 */
  runtimeConfig: InstallerRuntimeConfig
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
  vars: string
}

interface KV {
  /** @description 键 */
  key: string
  /** @description 值 */
  val: string | number | boolean
}

export interface InstallerRuntimeConfig {
  pairs: KV[]
  filename: PresetPMRcFileName
  delimiter: LiteralUnion<': ' | ' = '>
}

export interface PkgManifest {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}
