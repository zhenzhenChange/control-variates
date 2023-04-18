# Control Variates

Automated testing using the control variable method.

## Bootstrap

```shell
pnpm i
pnpm benchmark
```

## Benchmark Results

- `xxx/run-[fixture.name || fixture.index]-results/benchmark.html`
- `xxx/run-[fixture.name || fixture.index]-results/benchmark.json`

## Benchmark References

- [https://pnpm.io/benchmarks](https://pnpm.io/benchmarks)
- [https://yarnpkg.com/benchmarks](https://yarnpkg.com/benchmarks)

## Dependencies

- `tsx`: Executing code in node using ESM and TS.
- `uuid`: Generate a random temporary directory.
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
| `install` |   ✔   |    ✔     |      ✔       |
| `install` |   ✔   |          |              |
| `install` |       |    ✔     |              |
| `install` |       |          |      ✔       |
| `install` |   ✔   |    ✔     |              |
| `install` |   ✔   |          |      ✔       |
| `install` |       |    ✔     |      ✔       |
| `dynamic` |  N/A  |   N/A    |     N/A      |

## Todo

- [ ] 可视化输出
  - [ ] 安装命令
  - [ ] 系统配置
  - [ ] 磁盘占用
- [ ] 跨平台兼容
- [ ] 文件删除
  - [ ] 异步删除
  - [ ] 删除耗时
  - [ ] 删除进度
- [ ] 支持`monorepo`
- [ ] 支持多线程（支持限制系统参数）
  - [ ] 尝试使用 Rust 重写

## 重点审查

- [ ] 根据跑分结果，分析并总结其内部结构与工作流程
