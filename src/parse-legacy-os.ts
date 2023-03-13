import { cpus, freemem, hostname, platform, release, totalmem, type, userInfo, version } from 'node:os'

import { byteToGiB } from './helper'

interface HostOS {
  /** @description 系统宿主 */
  hostname: string
  /** @description 系统用户 */
  username: string

  /** @description CPU 名称 */
  cpu: string
  /** @description CPU 核数 */
  cpuCores: number

  /** @description 总内存 */
  ram: string
  /** @description 可用内存 */
  ramAvailable: string

  /** @description 操作系统 */
  system: string
  /** @description 操作系统版本 */
  systemVersion: string

  /** @description 系统平台 */
  platform: string
  /** @description 系统发行版本 */
  platformVersion: string
}

const ROUNDS = 3 /* 进位次数 */
const BINARY = 1024 /* 进制 */

export function parseOS(): HostOS {
  const hostHostname = hostname()
  const hostUsername = userInfo().username

  const hostCPU = cpus()
  const hostCPUCores = hostCPU.length
  const hostCPUModel = hostCPU.at(0)?.model ?? 'Unknown'

  const hostRAM = byteToGiB(totalmem(), BINARY, ROUNDS)
  const hostRAMAvailable = byteToGiB(freemem(), BINARY, ROUNDS)

  const hostSystem = type()
  const hostSystemVersion = version()

  const hostPlatform = platform()
  const hostPlatformVersion = release()

  return {
    hostname: hostHostname,
    username: hostUsername,

    cpu: hostCPUModel,
    cpuCores: hostCPUCores,

    ram: hostRAM,
    ramAvailable: hostRAMAvailable,

    system: hostSystem,
    systemVersion: hostSystemVersion,

    platform: hostPlatform,
    platformVersion: hostPlatformVersion,
  }
}
