# Control Variates

Automated testing using the control variable method.

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

---

|  command  | cache | lockfile | node_modules | Npm | Yarn | Yarn PnP | Pnpm |
| :-------: | :---: | :------: | :----------: | :-: | ---: | -------: | ---: |
| `install` |       |          |              |     |      |          |      |
| `install` |   ✔   |          |              |     |      |          |      |
| `install` |       |    ✔     |              |     |      |          |      |
| `install` |       |          |      ✔       |     |      |          |      |
| `install` |   ✔   |    ✔     |              |     |      |          |      |
| `install` |   ✔   |          |      ✔       |     |      |          |      |
| `install` |       |    ✔     |      ✔       |     |      |          |      |
| `install` |   ✔   |    ✔     |      ✔       |     |      |          |      |
