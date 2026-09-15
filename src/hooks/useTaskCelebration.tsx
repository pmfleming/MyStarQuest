import { useCallback, useEffect, useRef, useState } from 'react'
import RewardCelebration, {
  type RewardCelebrationDetails,
} from '../components/RewardCelebration'
import type { Theme } from '../contexts/ThemeContext'
import { getManageTaskCompletedAt, type TaskWithEphemeral } from '../data/types'
import type { ListRowDescriptor } from '../ui/listDescriptorTypes'
import { getTaskSuccessImage } from '../ui/taskSuccessImage'
import { uiTokens } from '../tokens'

type Entry = {
  item: TaskWithEphemeral
  index: number
  scope: string
  details?: RewardCelebrationDetails
  finished?: boolean
  finish: () => void
}

export function useTaskCelebration({
  activeChildId,
  dateKey,
  totalStars,
  items,
}: {
  activeChildId: string | null
  dateKey: string
  totalStars: number
  items: TaskWithEphemeral[]
}) {
  const scope = `${activeChildId}/${dateKey}`
  const [entries, setEntries] = useState<Record<string, Entry>>({})
  const [entryScope, setEntryScope] = useState(scope)
  if (entryScope !== scope) {
    setEntryScope(scope)
    setEntries({})
  } else {
    // Drop the retained image as soon as a completed task is reset or removed.
    const staleIds = Object.keys(entries).filter(
      (id) =>
        entries[id]?.finished &&
        !items.some((item) => item.id === id && getManageTaskCompletedAt(item))
    )
    if (staleIds.length) {
      const next = { ...entries }
      for (const id of staleIds) delete next[id]
      setEntries(next)
    }
  }
  const pending = useRef(new Set<string>())
  const session = useRef(0)

  const clear = useCallback(() => {
    session.current += 1
    pending.current.clear()
    setEntries({})
  }, [])

  useEffect(() => {
    const pendingItems = pending.current
    return () => {
      session.current += 1
      pendingItems.clear()
    }
  }, [scope])

  const run = async (
    item: TaskWithEphemeral,
    items: TaskWithEphemeral[],
    action: (
      onAward: (delta: number, starsBefore?: number) => void
    ) => Promise<unknown>
  ) => {
    if (pending.current.has(item.id)) return
    pending.current.add(item.id)
    const currentSession = session.current
    const finish = () => {
      if (currentSession !== session.current) return
      pending.current.delete(item.id)
      setEntries((previous) => {
        const next = { ...previous }
        const current = next[item.id]
        if (current?.details) next[item.id] = { ...current, finished: true }
        else delete next[item.id]
        return next
      })
    }
    // Keep one-time tasks in place even if the subscription removes them
    // before the completion request resolves.
    const entry: Entry = {
      item,
      index: items.findIndex((candidate) => candidate.id === item.id),
      scope,
      finish,
    }
    setEntries((previous) => ({ ...previous, [item.id]: entry }))
    let awardedStars = 0
    let balanceBefore = totalStars
    try {
      await action((delta, starsBefore) => {
        awardedStars = delta
        balanceBefore = starsBefore ?? totalStars
      })
      if (currentSession !== session.current) return
      if (awardedStars <= 0) {
        finish()
        return
      }
      setEntries((previous) => ({
        ...previous,
        [item.id]: {
          ...entry,
          details: {
            title: item.title,
            starsBefore: balanceBefore,
            starsAfter: balanceBefore + awardedStars,
          },
        },
      }))
    } catch (error) {
      finish()
      throw error
    }
  }

  const activeEntry = (item: TaskWithEphemeral) => {
    const entry = entries[item.id]
    return entry?.scope === scope &&
      (!entry.finished || getManageTaskCompletedAt(item))
      ? entry
      : undefined
  }
  const isBusy = (item: TaskWithEphemeral) => {
    const entry = activeEntry(item)
    return Boolean(entry && !entry.finished)
  }

  const retainItems = <T extends TaskWithEphemeral>(items: T[]): T[] => {
    const visible = [...items]
    for (const entry of Object.values(entries).sort(
      (a, b) => a.index - b.index
    )) {
      if (
        entry.scope === scope &&
        !entry.finished &&
        !visible.some((item) => item.id === entry.item.id)
      ) {
        visible.splice(Math.max(0, entry.index), 0, entry.item as T)
      }
    }
    return visible
  }

  const decorate = (
    descriptor: ListRowDescriptor<TaskWithEphemeral>,
    theme: Theme
  ): ListRowDescriptor<TaskWithEphemeral> => ({
    ...descriptor,
    isHighlighted: (item) =>
      Boolean(activeEntry(item)?.details) ||
      Boolean(descriptor.isHighlighted?.(item)),
    renderHeader: (item) =>
      activeEntry(item)?.details ? null : descriptor.renderHeader?.(item),
    getPrimaryAction: (item) => {
      const action = descriptor.getPrimaryAction(item)
      return activeEntry(item)?.details
        ? {
            ...action,
            hideButton: true,
            disabled: isBusy(item) || action.disabled,
          }
        : isBusy(item)
          ? { ...action, disabled: true }
          : action
    },
    getUtilityAction: (item) => {
      const action = descriptor.getUtilityAction?.(item)
      return action && isBusy(item) ? { ...action, disabled: true } : action
    },
    getStarCount: (item) =>
      activeEntry(item)?.details ? undefined : descriptor.getStarCount?.(item),
    renderItem: (item) => {
      const entry = activeEntry(item)
      if (!entry?.details) return descriptor.renderItem(item)
      const image = getTaskSuccessImage(item, theme)
      return (
        <div
          style={{
            height: uiTokens.cardOutcomeBodyHeight,
          }}
        >
          <RewardCelebration
            reward={entry.details}
            mode="earned"
            finished={entry.finished}
            imageSrc={image}
            theme={theme}
            onComplete={entry.finish}
          />
        </div>
      )
    },
  })

  return {
    run,
    clear,
    retainItems,
    decorate,
    isBusy,
  }
}
