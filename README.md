# Control Variates

Automated testing using the control variable method.

## Bootstrap

```shell
pnpm i
pnpm benchmark
```

## Dependencies

- `tsx`: Executing code in node using ESM and TS.
- `uuid`: Generate random strings for directory creation.
- `chalk`: Beautifying console output.
- `rimraf`: For file deletion.
- `typescript`: Written with TS.
- `iconv-lite`: Solving the problem of messy Chinese output on the console.
- `cross-spawn`: Cross-platform compatible sub-process calls.

## Variables

系统参数：

- `CPU`
- `RAM`
- `DISK`
- `Node`
- `Project`

测试参数：

- `cache`
- `lockfile`
- `node_modules`

公平参数：

- `registry`
- `cacheDir`
- `storeDir`
- `ignoreScripts`
- `ignoreEngines`
- `ignorePeerDeps`

|  command  | cache | lockfile | node_modules |
| :-------: | :---: | :------: | :----------: |
| `install` |       |          |              |
| `install` |   ✔   |          |              |
| `install` |       |    ✔     |              |
| `install` |       |          |      ✔       |
| `install` |   ✔   |    ✔     |              |
| `install` |   ✔   |          |      ✔       |
| `install` |       |    ✔     |      ✔       |
| `install` |   ✔   |    ✔     |      ✔       |

## Todo

- [ ] 完善文档
- [ ] 补充架构图
- [ ] 跨平台兼容
- [ ] 代码重构优化
- [ ] 输出系统信息
- [ ] 输出磁盘占用
- [ ] 支持`monorepo`
- [ ] 支持图表可视化
- [ ] 修正 pnpm cache 删除缺失的问题
- [ ] 增加删除文件时的 Loading
- [ ] 支持变更依赖内容
- [ ] 支持其它包管理器
  - `TNpm`
  - `CNpm`
  - `Yarn v3 PnP`（目前仅横向对比`Yarn v1 Classic`是不公平的）
- [ ] 支持并发任务（在此类自动化任务中，极大程度上受限于机器性能）

最终，根据跑分结果（各个包管理器在不同的变量控制下的表现），分析并总结其内部结构与工作流程。

## 遗留问题

若`package.json`中的依赖过多，当使用`Pnpm`进行安装时，若机器性能较弱，磁盘的占用率会长时间处于 100%。

**这有可能会导致操作系统卡死，只能强制按关机键重启，可能会丢失数据。**

经过我的观察（`Windows`），卡死的「点」基本上处于在对某些依赖的下载或链接上：

- `Babel PeerDependencies` 软链接失败
- `@parcel/transformer-js` 包体积过大（45MB）

![boom](images/boom.png)

## Benchmark Playground

![benchmark-playground](fixtures/playground/benchmark.png)
