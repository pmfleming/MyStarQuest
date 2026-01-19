import type { ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import {
  princessDeleteIcon,
  princessEditIcon,
} from '../assets/themes/princess/assets'
import { uiTokens } from '../ui/tokens'

type ActionConfig<T> = {
  label: string | ((item: T) => string)
  onClick: (item: T) => void
  icon?: ReactNode | ((item: T) => ReactNode)
  ariaLabel?: string | ((item: T) => string)
  disabled?: (item: T) => boolean
  variant?: 'primary' | 'neutral' | 'danger'
  showLabel?: boolean
}

type StandardActionListProps<T> = {
  theme: Theme
  items: T[]
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  addLabel: string
  onAdd: () => void
  addDisabled?: boolean
  isLoading?: boolean
  emptyState?: ReactNode
  getKey?: (item: T) => string
  isHighlighted?: (item: T) => boolean
}

const resolveValue = <T,>(
  value: string | ReactNode | ((item: T) => string | ReactNode),
  item: T
) => (typeof value === 'function' ? value(item) : value)

const StandardActionList = <T,>({
  theme,
  items,
  renderItem,
  primaryAction,
  onEdit,
  onDelete,
  addLabel,
  onAdd,
  addDisabled = false,
  isLoading = false,
  emptyState,
  getKey,
  isHighlighted,
}: StandardActionListProps<T>) => {
  const isDarkTheme = theme.id === 'space'

  const actionBaseStyle = {
    height: '56px',
    borderRadius: '9999px',
    borderWidth: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0 16px',
    fontWeight: 700,
    fontSize: '16px',
    fontFamily: theme.fonts.body,
    transition: 'transform 0.15s ease',
  } as const

  const rowBaseStyle = {
    borderRadius: '32px',
    padding: '20px',
    border: `3px solid ${theme.colors.primary}`,
    boxShadow: `0 0 16px ${theme.colors.primary}55`,
  } as const

  const getActionStyle = (variant?: ActionConfig<T>['variant']) => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: 'rgba(239,68,68,0.15)',
          borderColor: 'rgba(239,68,68,0.6)',
          color: '#b91c1c',
        }
      case 'neutral':
        return {
          backgroundColor:
            theme.id === 'princess' ? theme.colors.surface : 'rgba(0,0,0,0.1)',
          borderColor: theme.colors.primary,
          color: theme.colors.text,
        }
      case 'primary':
      default:
        return {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.accent,
          color: isDarkTheme ? '#000' : '#FFF',
        }
    }
  }

  return (
    <div className="flex flex-col gap-4" style={{ width: '100%' }}>
      {isLoading ? (
        <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
          Loading...
        </div>
      ) : items.length === 0 ? (
        (emptyState ?? (
          <div className="rounded-3xl bg-black/10 p-6 text-center text-lg font-bold">
            Nothing here yet.
          </div>
        ))
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const isItemHighlighted = isHighlighted?.(item)
            const primaryDisabled = primaryAction.disabled?.(item) ?? false
            const rowStyle = isItemHighlighted
              ? {
                  ...rowBaseStyle,
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  color: isDarkTheme ? '#000' : '#FFF',
                }
              : {
                  ...rowBaseStyle,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }

            return (
              <div
                key={getKey ? getKey(item) : `${index}`}
                className="flex flex-col gap-4"
                style={rowStyle}
              >
                <div
                  className="flex flex-col gap-2"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {renderItem(item)}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => primaryAction.onClick(item)}
                    disabled={primaryDisabled}
                    className="active:scale-95 disabled:opacity-60"
                    aria-label={
                      resolveValue(
                        primaryAction.ariaLabel ?? primaryAction.label,
                        item
                      ) as string
                    }
                    style={{
                      ...actionBaseStyle,
                      ...getActionStyle(primaryAction.variant),
                    }}
                  >
                    {resolveValue(primaryAction.icon ?? '⭐', item)}
                    {primaryAction.showLabel === false ? null : (
                      <span>{resolveValue(primaryAction.label, item)}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="active:scale-95"
                    aria-label="Edit"
                    style={{
                      ...actionBaseStyle,
                      ...getActionStyle('neutral'),
                    }}
                  >
                    {theme.id === 'princess' ? (
                      <img
                        src={princessEditIcon}
                        alt="Edit"
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <span>✏️</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="active:scale-95"
                    aria-label="Delete"
                    style={{
                      ...actionBaseStyle,
                      ...getActionStyle('danger'),
                    }}
                  >
                    {theme.id === 'princess' ? (
                      <img
                        src={princessDeleteIcon}
                        alt="Delete"
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <span>🗑️</span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={addDisabled}
        className="flex w-full items-center justify-center gap-3 rounded-3xl py-4 text-xl font-bold transition active:scale-95 disabled:opacity-60"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.primary,
          border: `3px dashed ${theme.colors.primary}`,
          minHeight: `${uiTokens.actionButtonHeight}px`,
        }}
      >
        <span>➕</span> {addLabel}
      </button>
    </div>
  )
}

export default StandardActionList
