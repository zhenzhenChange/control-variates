export function byteToGiB(value: number, binary: number, rounds: number) {
  return `${(value / binary ** rounds).toFixed(2)} GiB`
}
