/** Shuffle a copy in linear time, preserving every value and its identity. */
export function shuffle<T>(items: readonly T[]): T[]
export function shuffle(items: readonly unknown[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}
