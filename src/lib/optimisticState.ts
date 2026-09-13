/** Settle only matching fields, preserving edits made while a write was pending. */
export function settleOptimisticPatch<Patch extends object>(
  previous: Record<string, Patch>,
  id: string,
  settled: Patch,
  restore?: Patch
) {
  const current = previous[id]
  if (!current) return previous
  const remaining = { ...current }
  for (const key in settled) {
    if (!Object.hasOwn(settled, key) || !Object.is(current[key], settled[key]))
      continue
    delete remaining[key]
    if (restore && key in restore) remaining[key] = restore[key]
  }
  const next = { ...previous }
  if (Object.keys(remaining).length === 0) delete next[id]
  else next[id] = remaining
  return next
}

export const mergeOptimisticItems = <
  Item extends { id: string },
  Patch extends object,
>(
  items: Item[],
  overrides: Record<string, Patch>
): Item[] => {
  if (Object.keys(overrides).length === 0) return items
  return items.map((item) =>
    overrides[item.id] ? { ...item, ...overrides[item.id] } : item
  )
}
