import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
} from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import {
  princessDeleteIcon,
  princessEditIcon,
} from '../../assets/themes/princess/assets'
import { uiTokens } from '../../tokens'
import StarDisplay from './StarDisplay'
import {
  getStandardActionBaseStyle,
  getStandardActionVariantStyle,
} from './standardActionStyles'

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

type ActionVariant = 'primary' | 'neutral' | 'danger'

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

export type StandardActionListProps<T> = {
  theme: Theme
  items: T[]
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  onEdit?: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  utilityAction?: UtilityActionConfig<T>
  addLabel: string
  onAdd: () => void | Promise<void>
  addDisabled?: boolean
  isLoading?: boolean
  emptyState?: ReactNode
  getKey?: (item: T) => string
  isHighlighted?: (item: T) => boolean
  /** Optional: Return star count for an item to render the star field */
  getStarCount?: (item: T) => number | undefined
  /** When true, the Edit button is hidden. Can be scoped per row. */
  hideEdit?: boolean | ((item: T) => boolean)
  /** Key of the item currently being edited inline */
  editingId?: string
  /** Renders the full inline edit UI in place of normal row content when editingId matches */
  renderInlineEdit?: (item: T) => ReactNode
  /** When provided, renders an inline "new item" editor card at the bottom of the list
   *  (the Add button card is suppressed while this is set) */
  inlineNewRow?: ReactNode
  /** When false, renders inlineNewRow directly instead of wrapping it in an add-card frame. */
  frameInlineNewRow?: boolean
  /** When true, suppresses the add button card entirely */
  hideAdd?: boolean
}

const resolveValue = <T,>(
  value: string | ReactNode | ((item: T) => string | ReactNode),
  item: T
) => (typeof value === 'function' ? value(item) : value)

const resolveTextValue = <T,>(
  value: string | ((item: T) => string),
  item: T
) => (typeof value === 'function' ? value(item) : value)

const resolveVariant = <T,>(
  value: ActionConfig<T>['variant'],
  item: T,
  fallback: ActionVariant
): ActionVariant =>
  typeof value === 'function' ? value(item) : (value ?? fallback)

const runActionSafely = (
  actionName: string,
  action: () => void | Promise<void>
) => {
  try {
    const result = action()
    if (result instanceof Promise) {
      result.catch((error) => {
        console.error(`Failed to run ${actionName}`, error)
      })
    }
  } catch (error) {
    console.error(`Failed to run ${actionName}`, error)
  }
}

type ActionCardProps<T> = {
  item: T
  index: number
  theme: Theme
  isDarkTheme: boolean
  rowBaseStyle: CSSProperties
  isItemHighlighted: boolean
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  primaryDisabled: boolean
  onEdit?: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  utilityAction?: UtilityActionConfig<T>
  getActionStyle: (variant?: ActionConfig<T>['variant']) => CSSProperties
  actionBaseStyle: CSSProperties
  getKey?: (item: T) => string
  getStarCount?: (item: T) => number | undefined
  hideEdit?: boolean | ((item: T) => boolean)
  editingId?: string
  renderInlineEdit?: (item: T) => ReactNode
}

const resolveBoolean = <T,>(
  value: boolean | ((item: T) => boolean) | undefined,
  item: T,
  fallback = false
) => (typeof value === 'function' ? value(item) : (value ?? fallback))

const DefaultActionIcon = ({
  theme,
  type,
}: {
  theme: Theme
  type: 'edit' | 'delete'
}) => {
  if (theme.id !== 'princess') {
    return <span>{type === 'edit' ? '✏️' : '🗑️'}</span>
  }

  const label = type === 'edit' ? 'Edit' : 'Delete'
  return (
    <img
      src={type === 'edit' ? princessEditIcon : princessDeleteIcon}
      alt={label}
      loading="lazy"
      decoding="async"
      className="h-6 w-6 object-contain"
    />
  )
}

type UtilityButtonProps = {
  ariaLabel: string
  icon: ReactNode
  onClick: () => void
  style: CSSProperties
  disabled?: boolean
  isDanger?: boolean
}

const UtilityButton = ({
  ariaLabel,
  icon,
  onClick,
  style,
  disabled,
  isDanger,
}: UtilityButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`whimsical-btn whimsical-btn-utility disabled:opacity-60 ${isDanger ? 'whimsical-btn-delete' : ''}`}
    aria-label={ariaLabel}
    style={style}
  >
    {icon}
  </button>
)

type ActionButtonsProps<T> = {
  item: T
  theme: Theme
  primaryAction: ActionConfig<T>
  primaryDisabled: boolean
  hidePrimary: boolean
  hideEdit: boolean
  hideUtility: boolean
  onEdit?: (item: T) => void | Promise<void>
  onUtility: () => void
  utilityIcon: ReactNode
  utilityAriaLabel: string
  utilityDisabled: boolean
  utilityVariant: ActionVariant
  actionBaseStyle: CSSProperties
  getActionStyle: (variant?: ActionConfig<T>['variant']) => CSSProperties
}

const ActionButtons = <T,>({
  item,
  theme,
  primaryAction,
  primaryDisabled,
  hidePrimary,
  hideEdit,
  hideUtility,
  onEdit,
  onUtility,
  utilityIcon,
  utilityAriaLabel,
  utilityDisabled,
  utilityVariant,
  actionBaseStyle,
  getActionStyle,
}: ActionButtonsProps<T>) => {
  const utilityStyle = {
    ...actionBaseStyle,
    width: `${uiTokens.listUtilityActionWidth}px`,
    minWidth: `${uiTokens.listUtilityActionWidth}px`,
    padding: 0,
  }
  const primaryVariant = resolveVariant(primaryAction.variant, item, 'primary')
  const showPrimaryLabel = resolveBoolean(primaryAction.showLabel, item, true)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${uiTokens.actionRowGap}px`,
        justifyContent: hidePrimary ? 'flex-end' : undefined,
      }}
    >
      {!hidePrimary && (
        <button
          type="button"
          onClick={() =>
            runActionSafely('primary action', () => primaryAction.onClick(item))
          }
          disabled={primaryDisabled}
          className="whimsical-btn flex-1 disabled:opacity-60"
          aria-label={resolveTextValue(
            primaryAction.ariaLabel ?? primaryAction.label,
            item
          )}
          style={{
            ...actionBaseStyle,
            ...getActionStyle(primaryVariant),
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {resolveValue(primaryAction.icon ?? '⭐', item)}
          {showPrimaryLabel && (
            <span>{resolveValue(primaryAction.label, item)}</span>
          )}
        </button>
      )}
      {!hideEdit && onEdit && (
        <UtilityButton
          ariaLabel="Edit"
          icon={<DefaultActionIcon theme={theme} type="edit" />}
          onClick={() => runActionSafely('edit action', () => onEdit(item))}
          style={{ ...utilityStyle, ...getActionStyle('neutral') }}
        />
      )}
      {!hideUtility && (
        <UtilityButton
          ariaLabel={utilityAriaLabel}
          icon={utilityIcon}
          onClick={onUtility}
          disabled={utilityDisabled}
          isDanger={utilityVariant === 'danger'}
          style={{ ...utilityStyle, ...getActionStyle(utilityVariant) }}
        />
      )}
    </div>
  )
}

const getUtilityAriaLabel = <T,>(
  action: UtilityActionConfig<T> | undefined,
  item: T
) =>
  action ? resolveTextValue(action.ariaLabel ?? action.label, item) : 'Delete'

const getUtilityIcon = <T,>(
  action: UtilityActionConfig<T> | undefined,
  item: T,
  defaultIcon: ReactNode
) =>
  action
    ? resolveValue(action.icon ?? defaultIcon, item) || defaultIcon
    : defaultIcon

const resolveUtilityState = <T,>(
  item: T,
  utilityAction: UtilityActionConfig<T> | undefined,
  defaultIcon: ReactNode
) => {
  const hidden = resolveBoolean(utilityAction?.hideButton, item)
  const action = hidden ? undefined : utilityAction

  return {
    action,
    hidden,
    variant: resolveVariant(action?.variant, item, 'danger'),
    ariaLabel: getUtilityAriaLabel(action, item),
    disabled: action?.disabled?.(item) ?? false,
    exits: action ? resolveBoolean(action.exits, item) : true,
    icon: getUtilityIcon(action, item, defaultIcon),
  }
}

const getCardStyle = (
  theme: Theme,
  rowBaseStyle: CSSProperties,
  isHighlighted: boolean,
  isDarkTheme: boolean
): CSSProperties =>
  isHighlighted
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
  utilityAction,
  getActionStyle,
  actionBaseStyle,
  getKey,
  getStarCount,
  hideEdit,
  editingId,
  renderInlineEdit,
}: ActionCardProps<T>) => {
  const [isExiting, setIsExiting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const utility = resolveUtilityState(
    item,
    utilityAction,
    <DefaultActionIcon theme={theme} type="delete" />
  )

  const handleUtilityAction = () => {
    const runAction = () => {
      if (utility.action) {
        runActionSafely('utility action', () => utility.action?.onClick(item))
        return
      }
      runActionSafely('delete action', () => onDelete(item))
    }

    if (utility.exits) {
      setIsExiting(true)
      setTimeout(runAction, 400)
      return
    }

    runAction()
  }

  const itemKey = getKey ? getKey(item) : `${index}`
  const isInlineEditing = editingId !== undefined && editingId === itemKey

  useEffect(() => {
    if (!isInlineEditing) return
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [isInlineEditing])

  const starCount = getStarCount?.(item)
  const hidePrimaryButton = resolveBoolean(primaryAction.hideButton, item)
  const hideEditButton = resolveBoolean(hideEdit, item)

  const inlineEditStyle: CSSProperties = {
    ...rowBaseStyle,
    background: theme.colors.surface,
    border: `3px solid ${theme.colors.primary}`,
    boxShadow: `0 10px 20px -5px ${theme.colors.primary}20`,
    color: theme.colors.text,
    boxSizing: 'border-box',
  }

  return (
    <div
      ref={cardRef}
      key={itemKey}
      className={`${isInlineEditing ? '' : 'whimsical-card'} flex flex-col ${isExiting ? 'whimsical-card-exiting' : ''}`}
      style={{
        ...(isInlineEditing
          ? inlineEditStyle
          : getCardStyle(theme, rowBaseStyle, isItemHighlighted, isDarkTheme)),
        gap: `${uiTokens.panelStackGap}px`,
      }}
    >
      {/* Inline edit mode — replaces normal content + actions */}
      {isInlineEditing && renderInlineEdit ? (
        <div className="flex min-w-0 flex-col">{renderInlineEdit(item)}</div>
      ) : (
        <>
          {/* Header / Content */}
          <div
            className="flex flex-col"
            style={{ fontFamily: theme.fonts.heading }}
          >
            {renderItem(item)}
          </div>

          {/* Star Field (if star count is provided) */}
          {starCount !== undefined && <StarDisplay count={starCount} />}

          <ActionButtons
            item={item}
            theme={theme}
            primaryAction={primaryAction}
            primaryDisabled={primaryDisabled}
            hidePrimary={hidePrimaryButton}
            hideEdit={hideEditButton}
            hideUtility={utility.hidden}
            onEdit={onEdit}
            onUtility={handleUtilityAction}
            utilityIcon={utility.icon}
            utilityAriaLabel={utility.ariaLabel}
            utilityDisabled={utility.disabled}
            utilityVariant={utility.variant}
            actionBaseStyle={actionBaseStyle}
            getActionStyle={getActionStyle}
          />
        </>
      )}
    </div>
  )
}

const ListMessage = ({
  theme,
  children,
}: {
  theme: Theme
  children: ReactNode
}) => (
  <div
    className="rounded-3xl p-6 text-center text-lg font-bold"
    style={{
      backgroundColor: `${theme.colors.primary}20`,
      color: theme.colors.text,
    }}
  >
    {children}
  </div>
)

type ListFooterProps = {
  theme: Theme
  rowBaseStyle: CSSProperties
  inlineNewRow?: ReactNode
  frameInlineNewRow: boolean
  hideAdd: boolean
  addLabel: string
  onAdd: () => void | Promise<void>
  addDisabled: boolean
}

const ListFooter = ({
  theme,
  rowBaseStyle,
  inlineNewRow,
  frameInlineNewRow,
  hideAdd,
  addLabel,
  onAdd,
  addDisabled,
}: ListFooterProps) => {
  if (inlineNewRow && !frameInlineNewRow) return inlineNewRow
  if (inlineNewRow) {
    return (
      <div
        className="flex flex-col"
        style={{
          ...rowBaseStyle,
          background: theme.colors.surface,
          border: `3px solid ${theme.colors.primary}`,
          boxShadow: `0 10px 20px -5px ${theme.colors.primary}20`,
          gap: `${uiTokens.panelStackGap}px`,
        }}
      >
        {inlineNewRow}
      </div>
    )
  }
  if (hideAdd) return null

  return (
    <div
      className="whimsical-card flex flex-col"
      style={{
        ...rowBaseStyle,
        border: `4px dashed ${theme.colors.primary}`,
        boxShadow: `0 10px 20px -5px ${theme.colors.primary}20`,
        background: theme.colors.surface,
      }}
    >
      <button
        type="button"
        onClick={() => runActionSafely('add action', onAdd)}
        disabled={addDisabled}
        className="whimsical-btn flex w-full items-center justify-center text-xl font-bold disabled:opacity-60"
        style={{
          color: theme.colors.primary,
          minHeight: `${uiTokens.actionButtonHeight}px`,
          fontFamily: theme.fonts.heading,
          cursor: addDisabled ? 'not-allowed' : 'pointer',
          background: 'transparent',
          border: 'none',
          gap: `${uiTokens.actionContentGap}px`,
        }}
      >
        <span>➕</span> {addLabel}
      </button>
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
  utilityAction,
  addLabel,
  onAdd,
  addDisabled = false,
  isLoading = false,
  emptyState,
  getKey,
  isHighlighted,
  getStarCount,
  hideEdit,
  editingId,
  renderInlineEdit,
  inlineNewRow,
  frameInlineNewRow = true,
  hideAdd = false,
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

  const actionBaseStyle = getStandardActionBaseStyle(theme)

  const rowBaseStyle: CSSProperties = {
    borderRadius: `${uiTokens.listItemRadius}px`,
    padding: `${uiTokens.listItemPadding}px`,
    border: `${uiTokens.listItemBorderWidth}px solid ${theme.colors.surface}`,
    boxShadow: cardShadow,
    background: `linear-gradient(145deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
  }

  const getActionStyle = (
    variant?: ActionConfig<T>['variant']
  ): CSSProperties =>
    getStandardActionVariantStyle(
      theme,
      typeof variant === 'function' ? 'primary' : variant
    )

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ width: '100%' }}>
        <ListMessage theme={theme}>Loading...</ListMessage>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ width: '100%' }}>
      <div
        className="flex flex-col"
        style={{ gap: `${uiTokens.panelStackGap}px` }}
      >
        {items.length === 0
          ? (emptyState ?? (
              <ListMessage theme={theme}>Nothing here yet.</ListMessage>
            ))
          : items.map((item, index) => (
              <ActionCard
                key={getKey ? getKey(item) : `${index}`}
                item={item}
                index={index}
                theme={theme}
                isDarkTheme={isDarkTheme}
                rowBaseStyle={rowBaseStyle}
                isItemHighlighted={isHighlighted?.(item) ?? false}
                renderItem={renderItem}
                primaryAction={primaryAction}
                primaryDisabled={primaryAction.disabled?.(item) ?? false}
                onEdit={onEdit}
                onDelete={onDelete}
                utilityAction={utilityAction}
                getActionStyle={getActionStyle}
                actionBaseStyle={actionBaseStyle}
                getKey={getKey}
                getStarCount={getStarCount}
                hideEdit={hideEdit}
                editingId={editingId}
                renderInlineEdit={renderInlineEdit}
              />
            ))}
        <ListFooter
          theme={theme}
          rowBaseStyle={rowBaseStyle}
          inlineNewRow={inlineNewRow}
          frameInlineNewRow={frameInlineNewRow}
          hideAdd={hideAdd}
          addLabel={addLabel}
          onAdd={onAdd}
          addDisabled={addDisabled}
        />
      </div>
    </div>
  )
}

export default StandardActionList
