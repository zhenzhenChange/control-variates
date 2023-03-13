import { run } from 'envinfo'

run({
  System: ['OS', 'CPU', 'Memory'],
  Binaries: ['npm', 'Node', 'Yarn'],
}).then((env) => console.log(env))
