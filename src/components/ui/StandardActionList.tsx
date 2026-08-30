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
import CardShell from './CardShell'
import { useAsyncAction } from './useAsyncAction'

// Inject whimsical CSS animations once
const WHIMSICAL_STYLES_ID = 'whimsical-action-list-styles'
const injectWhimsicalStyles = () => {
  if (document.getElementById(WHIMSICAL_STYLES_ID)) return
  const style = document.createElement('style')
  style.id = WHIMSICAL_STYLES_ID
  style.textContent = `
    @keyframes whimsical-poof {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0) rotate(45deg); opacity: 0; }
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
    @keyframes standard-card-spin {
      to { transform: rotate(360deg); }
    }
    .standard-card-spinner {
      animation: standard-card-spin 0.8s linear infinite;
    }
    .standard-card-primary-art img {
      width: ${uiTokens.listActionArtworkScale * 100}% !important;
      height: ${uiTokens.listActionArtworkScale * 100}% !important;
      max-width: none !important;
      max-height: none !important;
      object-fit: contain;
      display: block;
    }
    @media (prefers-reduced-motion: reduce) {
      .whimsical-card,
      .whimsical-card-exiting,
      .whimsical-btn,
      .standard-card-spinner {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
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
  renderHeader?: (item: T) => ReactNode
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
  getItemLabel?: (item: T) => string
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

type ActionCardProps<T> = {
  item: T
  index: number
  theme: Theme
  isItemHighlighted: boolean
  renderHeader?: (item: T) => ReactNode
  renderItem: (item: T) => ReactNode
  primaryAction: ActionConfig<T>
  primaryDisabled: boolean
  onEdit?: (item: T) => void | Promise<void>
  onDelete: (item: T) => void | Promise<void>
  utilityAction?: UtilityActionConfig<T>
  getActionStyle: (variant?: ActionConfig<T>['variant']) => CSSProperties
  actionBaseStyle: CSSProperties
  getKey?: (item: T) => string
  getItemLabel?: (item: T) => string
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

  return (
    <img
      src={type === 'edit' ? princessEditIcon : princessDeleteIcon}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className="h-6 w-6 object-contain"
    />
  )
}

type UtilityButtonProps = {
  ariaLabel: string
  icon: ReactNode
  onClick: () => void | Promise<void>
  style: CSSProperties
  disabled?: boolean
  isDanger?: boolean
  isPending?: boolean
  describedBy?: string
}

const UtilityButton = ({
  ariaLabel,
  icon,
  onClick,
  style,
  disabled,
  isDanger,
  isPending,
  describedBy,
}: UtilityButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || isPending}
    className={`whimsical-btn whimsical-btn-utility disabled:opacity-60 ${isDanger ? 'whimsical-btn-delete' : ''}`}
    aria-label={ariaLabel}
    aria-busy={isPending || undefined}
    aria-describedby={describedBy}
    style={style}
  >
    {isPending ? (
      <ActionSpinner />
    ) : (
      <span
        aria-hidden="true"
        style={{
          width: `${uiTokens.listUtilityIconSize}px`,
          height: `${uiTokens.listUtilityIconSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
    )}
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
  onPrimary: () => void | Promise<void>
  onEdit?: () => void | Promise<void>
  editAriaLabel: string
  onUtility: () => void | Promise<void>
  utilityIcon: ReactNode
  utilityAriaLabel: string
  utilityDisabled: boolean
  utilityVariant: ActionVariant
  actionBaseStyle: CSSProperties
  getActionStyle: (variant?: ActionConfig<T>['variant']) => CSSProperties
  pendingAction: 'primary' | 'edit' | 'utility' | null
  errorId?: string
}

const ActionSpinner = () => (
  <span
    className="standard-card-spinner"
    aria-hidden="true"
    style={{
      display: 'block',
      width: `${uiTokens.listActionSpinnerSize}px`,
      height: `${uiTokens.listActionSpinnerSize}px`,
      border: '3px solid currentColor',
      borderRightColor: 'transparent',
      borderRadius: '9999px',
      boxSizing: 'border-box',
    }}
  />
)

const ActionButtons = <T,>({
  item,
  theme,
  primaryAction,
  primaryDisabled,
  hidePrimary,
  hideEdit,
  hideUtility,
  onPrimary,
  onEdit,
  editAriaLabel,
  onUtility,
  utilityIcon,
  utilityAriaLabel,
  utilityDisabled,
  utilityVariant,
  actionBaseStyle,
  getActionStyle,
  pendingAction,
  errorId,
}: ActionButtonsProps<T>) => {
  const utilityStyle = {
    ...actionBaseStyle,
    width: `${uiTokens.listUtilityActionWidth}px`,
    minWidth: `${uiTokens.listUtilityActionWidth}px`,
    padding: 0,
  }
  const primaryVariant = resolveVariant(primaryAction.variant, item, 'primary')
  const anyPending = pendingAction !== null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          `${hidePrimary ? '' : 'minmax(0, 1fr) '}${!hideEdit && onEdit ? `${uiTokens.listUtilityActionWidth}px ` : ''}${!hideUtility ? `${uiTokens.listUtilityActionWidth}px` : ''}`.trim(),
        alignItems: 'stretch',
        gap: `${uiTokens.actionRowGap}px`,
        justifyContent: hidePrimary ? 'flex-end' : undefined,
        minHeight: `${uiTokens.listActionHeight}px`,
      }}
    >
      {!hidePrimary && (
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || anyPending}
          className="whimsical-btn disabled:opacity-60"
          aria-label={resolveTextValue(
            primaryAction.ariaLabel ?? primaryAction.label,
            item
          )}
          aria-busy={pendingAction === 'primary' || undefined}
          aria-describedby={errorId}
          style={{
            ...actionBaseStyle,
            ...getActionStyle(primaryVariant),
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
            height: '100%',
            minHeight: `${uiTokens.listActionHeight}px`,
          }}
        >
          {pendingAction === 'primary' ? (
            <ActionSpinner />
          ) : (
            <span
              className="standard-card-primary-art"
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {resolveValue(primaryAction.icon ?? '⭐', item)}
            </span>
          )}
        </button>
      )}
      {!hideEdit && onEdit && (
        <UtilityButton
          ariaLabel={editAriaLabel}
          icon={<DefaultActionIcon theme={theme} type="edit" />}
          onClick={onEdit}
          style={{ ...utilityStyle, ...getActionStyle('neutral') }}
          disabled={anyPending}
          isPending={pendingAction === 'edit'}
          describedBy={errorId}
        />
      )}
      {!hideUtility && (
        <UtilityButton
          ariaLabel={utilityAriaLabel}
          icon={utilityIcon}
          onClick={onUtility}
          disabled={utilityDisabled || anyPending}
          isDanger={utilityVariant === 'danger'}
          isPending={pendingAction === 'utility'}
          describedBy={errorId}
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

// Wrapper for individual action card with exit animation support
const ActionCard = <T,>({
  item,
  index,
  theme,
  isItemHighlighted,
  renderHeader,
  renderItem,
  primaryAction,
  primaryDisabled,
  onEdit,
  onDelete,
  utilityAction,
  getActionStyle,
  actionBaseStyle,
  getKey,
  getItemLabel,
  getStarCount,
  hideEdit,
  editingId,
  renderInlineEdit,
}: ActionCardProps<T>) => {
  const [isExiting, setIsExiting] = useState(false)
  const { pendingAction, actionError, runAction } = useAsyncAction<
    'primary' | 'edit' | 'utility'
  >()
  const cardRef = useRef<HTMLElement>(null)
  const resolvedUtility = resolveUtilityState(
    item,
    utilityAction,
    <DefaultActionIcon theme={theme} type="delete" />
  )
  const itemLabel = getItemLabel?.(item)
  const utility = {
    ...resolvedUtility,
    ariaLabel:
      !resolvedUtility.action && itemLabel
        ? `Delete ${itemLabel}`
        : resolvedUtility.ariaLabel,
  }

  const itemKey = getKey ? getKey(item) : `${index}`
  const isInlineEditing = editingId !== undefined && editingId === itemKey
  const errorId = `card-action-error-${itemKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  const handlePrimaryAction = async () => {
    await runAction('Action', 'primary', () => primaryAction.onClick(item))
  }

  const handleEditAction = onEdit
    ? async () => {
        await runAction('Edit', 'edit', () => onEdit(item))
      }
    : undefined

  const handleUtilityAction = async () => {
    const requiresConfirmation =
      utility.exits || utility.ariaLabel.toLowerCase().startsWith('reset')
    if (requiresConfirmation) {
      const confirmation = utility.exits
        ? itemLabel
          ? `Delete ${itemLabel}?`
          : `${utility.ariaLabel}?`
        : `${utility.ariaLabel}?`
      if (!window.confirm(confirmation)) return
    }

    const succeeded = await runAction(
      utility.exits ? 'Delete' : 'Reset',
      'utility',
      () => (utility.action ? utility.action.onClick(item) : onDelete(item))
    )

    if (succeeded && utility.exits) setIsExiting(true)
  }

  useEffect(() => {
    if (!isInlineEditing) return
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [isInlineEditing])

  const starCount = getStarCount?.(item)
  const hidePrimaryButton = resolveBoolean(primaryAction.hideButton, item)
  const hideEditButton = resolveBoolean(hideEdit, item)

  if (isInlineEditing && renderInlineEdit) {
    return (
      <CardShell
        ref={cardRef}
        theme={theme}
        variant="editing"
        body={
          <div className="flex min-w-0 flex-col">{renderInlineEdit(item)}</div>
        }
      />
    )
  }

  const footer = (
    <ActionButtons
      item={item}
      theme={theme}
      primaryAction={primaryAction}
      primaryDisabled={primaryDisabled}
      hidePrimary={hidePrimaryButton}
      hideEdit={hideEditButton}
      hideUtility={utility.hidden}
      onPrimary={handlePrimaryAction}
      onEdit={handleEditAction}
      editAriaLabel={
        getItemLabel?.(item) ? `Edit ${getItemLabel(item)}` : 'Edit item'
      }
      onUtility={handleUtilityAction}
      utilityIcon={utility.icon}
      utilityAriaLabel={utility.ariaLabel}
      utilityDisabled={utility.disabled}
      utilityVariant={utility.variant}
      actionBaseStyle={actionBaseStyle}
      getActionStyle={getActionStyle}
      pendingAction={pendingAction}
      errorId={actionError ? errorId : undefined}
    />
  )

  return (
    <CardShell
      ref={cardRef}
      key={itemKey}
      theme={theme}
      variant={isItemHighlighted ? 'highlighted' : 'default'}
      className={`whimsical-card ${isExiting ? 'whimsical-card-exiting' : ''}`}
      header={renderHeader?.(item)}
      body={renderItem(item)}
      status={
        starCount !== undefined || actionError ? (
          <>
            {starCount !== undefined && <StarDisplay count={starCount} />}
            {actionError && (
              <p
                id={errorId}
                role="alert"
                style={{ margin: 0, fontWeight: 700 }}
              >
                {actionError}
              </p>
            )}
          </>
        ) : undefined
      }
      footer={footer}
      ariaBusy={pendingAction !== null}
    />
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
  inlineNewRow?: ReactNode
  frameInlineNewRow: boolean
  hideAdd: boolean
  addLabel: string
  onAdd: () => void | Promise<void>
  addDisabled: boolean
}

const ListFooter = ({
  theme,
  inlineNewRow,
  frameInlineNewRow,
  hideAdd,
  addLabel,
  onAdd,
  addDisabled,
}: ListFooterProps) => {
  const {
    pendingAction,
    actionError: addError,
    runAction,
  } = useAsyncAction<'add'>()
  const isAdding = pendingAction === 'add'

  const handleAdd = async () => {
    if (addDisabled) return
    await runAction('Add', 'add', onAdd)
  }

  if (inlineNewRow && !frameInlineNewRow) return inlineNewRow
  if (inlineNewRow) {
    return <CardShell theme={theme} variant="editing" body={inlineNewRow} />
  }
  if (hideAdd) return null

  return (
    <CardShell
      theme={theme}
      variant="add"
      className="whimsical-card"
      ariaBusy={isAdding}
      status={
        addError ? (
          <p id="card-add-error" role="alert" style={{ margin: 0 }}>
            {addError}
          </p>
        ) : undefined
      }
      body={
        <button
          type="button"
          aria-label={addLabel}
          aria-busy={isAdding || undefined}
          aria-describedby={addError ? 'card-add-error' : undefined}
          onClick={handleAdd}
          disabled={addDisabled || isAdding}
          className="whimsical-btn flex w-full items-center justify-center text-xl font-bold disabled:opacity-60"
          style={{
            color: theme.colors.primary,
            minHeight: `${uiTokens.listActionHeight}px`,
            fontFamily: theme.fonts.heading,
            cursor: addDisabled || isAdding ? 'not-allowed' : 'pointer',
            background: 'transparent',
            border: 'none',
            gap: `${uiTokens.actionContentGap}px`,
          }}
        >
          {isAdding ? <ActionSpinner /> : <span aria-hidden="true">➕</span>}
        </button>
      }
    />
  )
}

const StandardActionList = <T,>({
  theme,
  items,
  renderHeader,
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
  getItemLabel,
  isHighlighted,
  getStarCount,
  hideEdit,
  editingId,
  renderInlineEdit,
  inlineNewRow,
  frameInlineNewRow = true,
  hideAdd = false,
}: StandardActionListProps<T>) => {
  // Inject CSS animations on mount
  useEffect(() => {
    injectWhimsicalStyles()
  }, [])

  const actionBaseStyle = getStandardActionBaseStyle(theme)

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
              <ActionCard<T>
                key={getKey ? getKey(item) : `${index}`}
                item={item}
                index={index}
                theme={theme}
                isItemHighlighted={isHighlighted?.(item) ?? false}
                renderHeader={renderHeader}
                renderItem={renderItem}
                primaryAction={primaryAction}
                primaryDisabled={primaryAction.disabled?.(item) ?? false}
                onEdit={onEdit}
                onDelete={onDelete}
                utilityAction={utilityAction}
                getActionStyle={getActionStyle}
                actionBaseStyle={actionBaseStyle}
                getKey={getKey}
                getItemLabel={getItemLabel}
                getStarCount={getStarCount}
                hideEdit={hideEdit}
                editingId={editingId}
                renderInlineEdit={renderInlineEdit}
              />
            ))}
        <ListFooter
          theme={theme}
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
