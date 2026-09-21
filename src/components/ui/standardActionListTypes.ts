import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'

export type ActionVariant = 'primary' | 'neutral' | 'danger'

export type ActionConfig<T> = {
  label: string | ((item: T) => string)
  onClick: (item: T) => void | Promise<void>
  icon?: ReactNode | ((item: T) => ReactNode)
  ariaLabel?: string | ((item: T) => string)
  disabled?: (item: T) => boolean
  hideButton?: boolean | ((item: T) => boolean)
  variant?: ActionVariant | ((item: T) => ActionVariant)
  showLabel?: boolean | ((item: T) => boolean)
}

export type UtilityActionConfig<T> = ActionConfig<T> & {
  exits?: boolean | ((item: T) => boolean)
}

export type ActionCardContentProps<T> = {
  theme: Theme
  renderHeader?: (item: T) => ReactNode
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  onEdit?: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  utilityAction?: UtilityActionConfig<T>
  getKey?: (item: T) => string
  getItemLabel?: (item: T) => string
  getStarCount?: (item: T) => number | undefined
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
  isHighlighted?: (item: T) => boolean
  inlineNewRow?: ReactNode
  frameInlineNewRow?: boolean
  hideAdd?: boolean
}

export type ActionStyleResolver<T> = (
  variant?: ActionConfig<T>['variant']
) => CSSProperties
