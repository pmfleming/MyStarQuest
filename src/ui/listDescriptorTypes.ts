import type { ReactNode } from 'react'
import type {
  ActionConfig,
  StandardActionListProps,
  UtilityActionConfig,
} from '../components/ui/StandardActionList'

type ActionVariant = 'primary' | 'neutral' | 'danger'

export type StandardActionListDescriptor<T> = Pick<
  StandardActionListProps<T>,
  | 'renderItem'
  | 'getStarCount'
  | 'isHighlighted'
  | 'primaryAction'
  | 'utilityAction'
>

export type ResolvedListAction<T> = {
  label: string
  ariaLabel?: string
  icon?: ReactNode
  disabled?: boolean
  hideButton?: boolean
  variant?: ActionVariant
  showLabel?: boolean
  onClick: (item: T) => void | Promise<void>
}

export type ResolvedListUtilityAction<T> = ResolvedListAction<T> & {
  exits?: boolean
}

export type ListRowDescriptor<T> = {
  renderItem: (item: T) => ReactNode
  getPrimaryAction: (item: T) => ResolvedListAction<T>
  getUtilityAction?: (item: T) => ResolvedListUtilityAction<T>
  getStarCount?: (item: T) => number | undefined
  isHighlighted?: (item: T) => boolean
}

export const toStandardActionListDescriptor = <T>(
  descriptor: ListRowDescriptor<T>
): StandardActionListDescriptor<T> => {
  const primaryAction: ActionConfig<T> = {
    label: (item) => descriptor.getPrimaryAction(item).label,
    ariaLabel: (item) =>
      descriptor.getPrimaryAction(item).ariaLabel ??
      descriptor.getPrimaryAction(item).label,
    icon: (item) => descriptor.getPrimaryAction(item).icon,
    disabled: (item) => descriptor.getPrimaryAction(item).disabled ?? false,
    hideButton: (item) => descriptor.getPrimaryAction(item).hideButton ?? false,
    variant: (item) => descriptor.getPrimaryAction(item).variant ?? 'primary',
    showLabel: (item) => descriptor.getPrimaryAction(item).showLabel ?? true,
    onClick: (item) => descriptor.getPrimaryAction(item).onClick(item),
  }

  const utilityAction: UtilityActionConfig<T> | undefined =
    descriptor.getUtilityAction
      ? {
          label: (item) =>
            descriptor.getUtilityAction?.(item)?.label ?? 'Delete',
          ariaLabel: (item) =>
            descriptor.getUtilityAction?.(item)?.ariaLabel ?? 'Delete',
          icon: (item) => descriptor.getUtilityAction?.(item)?.icon,
          disabled: (item) =>
            descriptor.getUtilityAction?.(item)?.disabled ?? false,
          variant: (item) =>
            descriptor.getUtilityAction?.(item)?.variant ?? 'danger',
          showLabel: (item) =>
            descriptor.getUtilityAction?.(item)?.showLabel ?? true,
          exits: (item) => descriptor.getUtilityAction?.(item)?.exits ?? false,
          onClick: (item) => descriptor.getUtilityAction?.(item)?.onClick(item),
        }
      : undefined

  return {
    renderItem: descriptor.renderItem,
    getStarCount: descriptor.getStarCount,
    isHighlighted: descriptor.isHighlighted,
    primaryAction,
    utilityAction,
  }
}
