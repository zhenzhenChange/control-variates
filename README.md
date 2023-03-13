# Control Variates

Automated testing using the control variable method.

## 包管理器概述

### Yarn

### Pnpm

### NPM / Cnpm / Tnpm

## 控制变量

测试基准：[Benchmarks](https://github.com/pnpm/benchmarks-of-javascript-package-managers#benchmarks-of-javascript-package-managers)

版本参数：

- `Node`
- `Yarn`
- `Pnpm`

变量参数：

- `cache`
- `lockfile`
- `node_modules`

---

测试参数：

- `CPU`
- `RAM`
- `Project`

|   命令    | cache | lockfile | node_modules |          Yarn |      Yarn PnP |          Pnpm |
| :-------: | :---: | :------: | :----------: | ------------: | ------------: | ------------: |
| `update`  |       |          |              | 1s <br /> 1GB | 1s <br /> 1GB | 1s <br /> 1GB |
| `install` |       |          |              |               |               |               |
| `install` |   ✔   |          |              |               |               |               |
| `install` |       |    ✔     |              |               |               |               |
| `install` |       |          |      ✔       |               |               |               |
| `install` |   ✔   |    ✔     |              |               |               |               |
| `install` |   ✔   |          |      ✔       |               |               |               |
| `install` |       |    ✔     |      ✔       |               |               |               |
| `install` |   ✔   |    ✔     |      ✔       |               |               |               |
