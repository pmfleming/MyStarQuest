import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'

export type ActionVariant = 'primary' | 'neutral' | 'danger'

export type ResolvedListAction<T> = {
  label: string
  onClick: (item: T) => void | Promise<void>
  icon?: ReactNode
  ariaLabel?: string
  disabled?: boolean
  hideButton?: boolean
  variant?: ActionVariant
}

export type ResolvedListUtilityAction<T> = ResolvedListAction<T> & {
  exits?: boolean
}

export type ListRowDescriptor<T> = {
  renderHeader?: (item: T) => ReactNode
  renderItem: (item: T) => ReactNode
  getPrimaryAction: (item: T) => ResolvedListAction<T>
  // Omit the getter for default deletion; return undefined to hide this row's utility.
  getUtilityAction?: (item: T) => ResolvedListUtilityAction<T> | undefined
  getStarCount?: (item: T) => number | undefined
  isHighlighted?: (item: T) => boolean
}

export type ActionCardContentProps<T> = ListRowDescriptor<T> & {
  theme: Theme
  onEdit?: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  getKey?: (item: T) => string
  getItemLabel?: (item: T) => string
  hideEdit?: boolean | ((item: T) => boolean)
  editingId?: string
  renderInlineEdit?: (item: T) => ReactNode
}

export type StandardActionListProps<T> = ActionCardContentProps<T> & {
  items: T[]
  addLabel: string
  onAdd: () => void | Promise<void>
  addDisabled?: boolean
  isLoading?: boolean
  emptyState?: ReactNode
  inlineNewRow?: ReactNode
  frameInlineNewRow?: boolean
  hideAdd?: boolean
}

export type ActionStyleResolver = (variant?: ActionVariant) => CSSProperties
