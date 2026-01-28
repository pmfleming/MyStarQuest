import { useState, useEffect, type ReactNode, type CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import {
  princessDeleteIcon,
  princessEditIcon,
} from '../assets/themes/princess/assets'
import { uiTokens } from '../ui/tokens'

// Inject whimsical CSS animations once
const WHIMSICAL_STYLES_ID = 'whimsical-action-list-styles'
const injectWhimsicalStyles = () => {
  if (document.getElementById(WHIMSICAL_STYLES_ID)) return
  const style = document.createElement('style')
  style.id = WHIMSICAL_STYLES_ID
  style.textContent = `
    @keyframes whimsical-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes whimsical-star-pop {
      0% { transform: scale(0) rotate(-180deg); opacity: 0; }
      60% { transform: scale(1.3) rotate(10deg); opacity: 1; }
      100% { transform: scale(1) rotate(var(--star-rot, 0deg)); opacity: 1; }
    }
    @keyframes whimsical-poof {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0) rotate(45deg); opacity: 0; }
    }
    .whimsical-card {
      animation: whimsical-float 5s ease-in-out infinite;
    }
    .whimsical-card:nth-child(even) {
      animation-delay: 1.2s;
    }
    .whimsical-card:nth-child(3n) {
      animation-delay: 0.6s;
    }
    .whimsical-card-exiting {
      animation: whimsical-poof 0.4s ease-in forwards !important;
      pointer-events: none;
    }
    .whimsical-star-unit {
      animation: whimsical-star-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) backwards;
    }
    .whimsical-btn {
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: pointer;
    }
    .whimsical-btn:hover:not(:disabled) {
      transform: translateY(-3px) scale(1.02);
    }
    .whimsical-btn:active:not(:disabled) {
      transform: scale(0.92) translateY(4px) !important;
    }
    .whimsical-btn-utility:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: #cbd5e1;
      color: #64748b;
    }
    .whimsical-btn-delete:hover:not(:disabled) {
      background: #fef2f2 !important;
      color: #ef4444 !important;
      border-color: #fecaca !important;
    }
  `
  document.head.appendChild(style)
}

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
  /** Optional: Return star count for an item to render the star field */
  getStarCount?: (item: T) => number
}

const resolveValue = <T,>(
  value: string | ReactNode | ((item: T) => string | ReactNode),
  item: T
) => (typeof value === 'function' ? value(item) : value)

// Star SVG component for the star field
const StarIcon = ({
  style,
  className,
  fill,
  stroke,
}: {
  style?: CSSProperties
  className?: string
  fill: string
  stroke: string
}) => (
  <svg viewBox="0 0 24 24" className={className} style={style}>
    <path
      d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.62L12 2L9.19 8.62L2 9.24L7.45 13.97L5.82 21L12 17.27Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

// Gold star colors matching the prototype (consistent across all themes)
const STAR_GOLD = '#fbbf24'
const STAR_STROKE = '#d97706'

// Dynamic Star Field Component with density system
const StarField = ({ count }: { count: number }) => {
  // Determine density based on count
  let densityClass: 'low' | 'medium' | 'high' = 'low'
  if (count > 40) densityClass = 'high'
  else if (count > 10) densityClass = 'medium'

  // Star sizing based on density (matching prototype exactly)
  const starSizes = {
    low: { width: 32, height: 32, gap: 8 },
    medium: { width: 20, height: 20, gap: 4 },
    high: { width: 12, height: 12, gap: 2 },
  }
  const { width, height, gap } = starSizes[densityClass]

  const containerStyle: CSSProperties = {
    background: '#f1f5f9',
    borderRadius: '20px',
    padding: densityClass === 'high' ? '8px' : '12px',
    minHeight: '60px',
    border: '2px dashed #cbd5e1',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${gap}px`,
  }

  if (count === 0) {
    return (
      <div style={containerStyle}>
        <span
          style={{
            opacity: 0.5,
            fontStyle: 'italic',
            color: '#64748b',
            fontSize: '0.9rem',
          }}
        >
          No stars yet...
        </span>
      </div>
    )
  }

  const stars = Array.from({ length: count })

  return (
    <div style={containerStyle}>
      {stars.map((_, i) => {
        const rot = ((i * 33) % 40) - 20
        return (
          <StarIcon
            key={i}
            className="whimsical-star-unit"
            fill={STAR_GOLD}
            stroke={STAR_STROKE}
            style={
              {
                width,
                height,
                flexShrink: 0,
                filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.1))',
                '--star-rot': `${rot}deg`,
                animationDelay: `${i * 0.03}s`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}

// Wrapper for individual action card with exit animation support
const ActionCard = <T,>({
  item,
  index,
  theme,
  isDarkTheme,
  rowBaseStyle,
  isItemHighlighted,
  renderItem,
  primaryAction,
  primaryDisabled,
  onEdit,
  onDelete,
  getActionStyle,
  actionBaseStyle,
  getKey,
  getStarCount,
}: {
  item: T
  index: number
  theme: Theme
  isDarkTheme: boolean
  rowBaseStyle: CSSProperties
  isItemHighlighted: boolean
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  primaryDisabled: boolean
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  getActionStyle: (variant?: ActionConfig<T>['variant']) => CSSProperties
  actionBaseStyle: CSSProperties
  getKey?: (item: T) => string
  getStarCount?: (item: T) => number
}) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleDelete = () => {
    setIsExiting(true)
    setTimeout(() => onDelete(item), 400)
  }

  const rowStyle: CSSProperties = isItemHighlighted
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

  const starCount = getStarCount?.(item)

  return (
    <div
      key={getKey ? getKey(item) : `${index}`}
      className={`whimsical-card flex flex-col ${isExiting ? 'whimsical-card-exiting' : ''}`}
      style={{ ...rowStyle, gap: `${uiTokens.singleVerticalSpace}px` }}
    >
      {/* Header / Content */}
      <div
        className="flex flex-col"
        style={{ fontFamily: theme.fonts.heading }}
      >
        {renderItem(item)}
      </div>

      {/* Star Field (if star count is provided) */}
      {starCount !== undefined && <StarField count={starCount} />}

      {/* Action Buttons - Horizontal row with spacing */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Primary Action - takes most space */}
        <button
          type="button"
          onClick={() => primaryAction.onClick(item)}
          disabled={primaryDisabled}
          className="whimsical-btn flex-1 disabled:opacity-60"
          aria-label={
            resolveValue(
              primaryAction.ariaLabel ?? primaryAction.label,
              item
            ) as string
          }
          style={{
            ...actionBaseStyle,
            ...getActionStyle(primaryAction.variant),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {resolveValue(primaryAction.icon ?? '⭐', item)}
          {primaryAction.showLabel === false ? null : (
            <span>{resolveValue(primaryAction.label, item)}</span>
          )}
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="whimsical-btn whimsical-btn-utility"
          aria-label="Edit"
          style={{
            ...actionBaseStyle,
            ...getActionStyle('neutral'),
            width: '60px',
            minWidth: '60px',
            padding: 0,
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

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="whimsical-btn whimsical-btn-utility whimsical-btn-delete"
          aria-label="Delete"
          style={{
            ...actionBaseStyle,
            ...getActionStyle('danger'),
            width: '60px',
            minWidth: '60px',
            padding: 0,
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
}

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
  getStarCount,
}: StandardActionListProps<T>) => {
  const isDarkTheme = theme.id === 'space'

  // Inject CSS animations on mount
  useEffect(() => {
    injectWhimsicalStyles()
  }, [])

  // Vibrant gradient shadow based on theme
  const cardShadow = `
    0 10px 20px -5px ${theme.colors.primary}30,
    0 6px 0 ${theme.colors.surface}66 inset
  `

  const actionBaseStyle: CSSProperties = {
    height: '60px',
    borderRadius: '20px',
    borderWidth: '2px',
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '0 20px',
    fontWeight: 700,
    fontSize: '1.1rem',
    fontFamily: theme.fonts.body,
    cursor: 'pointer',
    boxShadow: `0 6px 0 ${theme.colors.primary}60`,
  }

  const rowBaseStyle: CSSProperties = {
    borderRadius: '32px',
    padding: '24px',
    border: `4px solid ${theme.colors.surface}`,
    boxShadow: cardShadow,
    background: `linear-gradient(145deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
  }

  const getActionStyle = (
    variant?: ActionConfig<T>['variant']
  ): CSSProperties => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: 'rgba(239,68,68,0.15)',
          borderColor: 'rgba(239,68,68,0.6)',
          color: '#b91c1c',
          boxShadow: '0 6px 0 rgba(185,28,28,0.4)',
        }
      case 'neutral':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: `${theme.colors.primary}60`,
          color: theme.colors.text,
          boxShadow: `0 6px 0 ${theme.colors.primary}30`,
        }
      case 'primary':
      default:
        return {
          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
          borderColor: theme.colors.accent,
          color: isDarkTheme ? '#000' : '#FFF',
          boxShadow: `0 6px 0 ${theme.colors.secondary}80`,
        }
    }
  }

  return (
    <div className="flex flex-col" style={{ width: '100%' }}>
      {isLoading ? (
        <div
          className="rounded-3xl p-6 text-center text-lg font-bold"
          style={{
            backgroundColor: `${theme.colors.primary}20`,
            color: theme.colors.text,
          }}
        >
          Loading...
        </div>
      ) : (
        <div
          className="flex flex-col"
          style={{ gap: `${uiTokens.singleVerticalSpace}px` }}
        >
          {items.length === 0
            ? (emptyState ?? (
                <div
                  className="rounded-3xl p-6 text-center text-lg font-bold"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.text,
                  }}
                >
                  Nothing here yet.
                </div>
              ))
            : items.map((item, index) => {
                const isItemHighlighted = isHighlighted?.(item) ?? false
                const primaryDisabled = primaryAction.disabled?.(item) ?? false

                return (
                  <ActionCard
                    key={getKey ? getKey(item) : `${index}`}
                    item={item}
                    index={index}
                    theme={theme}
                    isDarkTheme={isDarkTheme}
                    rowBaseStyle={rowBaseStyle}
                    isItemHighlighted={isItemHighlighted}
                    renderItem={renderItem}
                    primaryAction={primaryAction}
                    primaryDisabled={primaryDisabled}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getActionStyle={getActionStyle}
                    actionBaseStyle={actionBaseStyle}
                    getKey={getKey}
                    getStarCount={getStarCount}
                  />
                )
              })}

          {/* Add Button Card */}
          <div
            className="whimsical-card flex flex-col"
            style={{
              ...rowBaseStyle,
              backgroundColor: theme.colors.surface,
              border: `4px dashed ${theme.colors.primary}`,
              boxShadow: `0 10px 20px -5px ${theme.colors.primary}20`,
              background: theme.colors.surface,
            }}
          >
            <button
              type="button"
              onClick={onAdd}
              disabled={addDisabled}
              className="whimsical-btn flex w-full items-center justify-center gap-3 text-xl font-bold disabled:opacity-60"
              style={{
                color: theme.colors.primary,
                minHeight: `${uiTokens.actionButtonHeight}px`,
                fontFamily: theme.fonts.heading,
                cursor: addDisabled ? 'not-allowed' : 'pointer',
                background: 'transparent',
                border: 'none',
              }}
            >
              <span>➕</span> {addLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StandardActionList
