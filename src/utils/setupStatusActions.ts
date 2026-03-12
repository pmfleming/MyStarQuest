export type SetupStatusActionRule<T> = {
  matches: (item: T) => boolean
  isInTask: (item: T) => boolean
  resetAriaLabel: string
  onReset: (item: T) => void | Promise<void>
}

export type ResolvedSetupStatusAction = {
  label: 'Delete' | 'Reset'
  ariaLabel: string
  exits: boolean
  variant: 'danger' | 'neutral'
  isReset: boolean
}

export const resolveSetupStatusAction = <T>(
  item: T,
  rules: SetupStatusActionRule<T>[],
  deleteAriaLabel: string
): ResolvedSetupStatusAction => {
  const matchingRule = rules.find((rule) => rule.matches(item))

  if (matchingRule && matchingRule.isInTask(item)) {
    return {
      label: 'Reset',
      ariaLabel: matchingRule.resetAriaLabel,
      exits: false,
      variant: 'neutral',
      isReset: true,
    }
  }

  return {
    label: 'Delete',
    ariaLabel: deleteAriaLabel,
    exits: true,
    variant: 'danger',
    isReset: false,
  }
}

export const runSetupStatusAction = <T>(
  item: T,
  rules: SetupStatusActionRule<T>[],
  onDelete: (item: T) => void | Promise<void>
) => {
  const matchingRule = rules.find((rule) => rule.matches(item))

  if (matchingRule && matchingRule.isInTask(item)) {
    return matchingRule.onReset(item)
  }

  return onDelete(item)
}
