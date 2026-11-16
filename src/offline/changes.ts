export const UNCHANGED = Symbol('unchanged offline mutation')

export function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a instanceof Date || b instanceof Date)
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  if (
    !a ||
    !b ||
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false
  const left = a as Record<string, unknown>,
    right = b as Record<string, unknown>
  const keys = Object.keys(left)
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && sameValue(left[key], right[key])
    )
  )
}

// Incoming snapshots are fresh clones; reuse unchanged subtrees for selectors.
export function shareSnapshot<T>(previous: T | undefined, next: T): T {
  if (sameValue(previous, next)) return previous as T
  if (
    !previous ||
    !next ||
    typeof previous !== 'object' ||
    typeof next !== 'object' ||
    previous instanceof Date ||
    next instanceof Date
  )
    return next
  const before = previous as Record<string, unknown>,
    after = next as Record<string, unknown>
  for (const key of Object.keys(after))
    after[key] = shareSnapshot(before[key], after[key])
  return next
}
