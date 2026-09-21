/** Settle only matching fields, preserving edits made while a write was pending. */
export function settleOptimisticPatch<Patch extends object>(
  previous: Record<string, Patch>,
  id: string,
  settled: Patch,
  restore?: Patch
) {
  const current = previous[id]
  if (!current) return previous
  let remaining = current
  for (const key in settled) {
    if (!Object.hasOwn(settled, key) || !Object.is(current[key], settled[key]))
      continue
    if (remaining === current) remaining = { ...current }
    delete remaining[key]
    if (restore && key in restore) remaining[key] = restore[key]
  }
  if (remaining === current) return previous
  const next = { ...previous }
  if (Object.keys(remaining).length === 0) delete next[id]
  else next[id] = remaining
  return next
}

/** Keep the complete patch until its snapshot acknowledges every field. */
export function reconcileOptimisticPatches<Patch extends object>(
  previous: Record<string, Patch>,
  items: { id: string }[]
) {
  const itemById = new Map(items.map((item) => [item.id, item]))
  let next = previous
  for (const [id, patch] of Object.entries(previous)) {
    const item = itemById.get(id)
    if (
      !item ||
      !Object.entries(patch).every(([key, value]) =>
        Object.is(Reflect.get(item, key), value)
      )
    )
      continue
    if (next === previous) next = { ...previous }
    delete next[id]
  }
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
