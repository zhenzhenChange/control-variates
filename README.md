# Control Variates

Automated testing using the control variable method.

## Bootstrap

```shell
pnpm i
pnpm benchmark
```

```text
# Benchmark Results:
## node_benchmarks/run-result-[fixture.name || fixture.index]/benchmark.html
## node_benchmarks/run-result-[fixture.name || fixture.index]/benchmark.json
```

## Dependencies

- `tsx`: Executing code in node using ESM and TS.
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

- [ ] 可视化输出
  - [ ] 安装命令
  - [ ] 系统配置
  - [ ] 磁盘占用
- [ ] 跨平台兼容
- [ ] 文件删除
  - [ ] 异步删除
  - [ ] 增加 Loading
- [ ] 支持`monorepo`
- [ ] 支持变更依赖内容
- [ ] 支持多线程（限制系统参数）
  - [ ] 尝试使用 Rust 重写

## 重点审查

- [ ] 检查 Pnpm 有关缺失缓存的测试用例数据异常问题
- [ ] 根据跑分结果，分析并总结其内部结构与工作流程
