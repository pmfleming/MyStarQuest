import { useEffect, useState, type ReactNode, type CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import StarDisplay from './StarDisplay'
import {
  getStandardActionBaseStyle,
  getStandardActionVariantStyle,
} from './standardActionStyles'
import CardShell from './CardShell'
import { ImageLoadingContext } from './ImageLoadingContext'
import { PrimaryActionImageContext } from './PrimaryActionImageContext'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import {
  ActionSpinner,
  DefaultActionIcon,
  StandardActionButtons,
} from './StandardActionButtons'
import {
  resolveActionBoolean,
  resolveActionText,
  resolveActionValue,
  resolveActionVariant,
} from './standardActionConfig'
import {
  injectStandardActionStyles,
  useCardExitAnimation,
} from './standardActionCardAnimations'
import type {
  ActionConfig,
  ActionCardContentProps,
  ActionStyleResolver,
  StandardActionListProps,
  UtilityActionConfig,
} from './standardActionListTypes'

const resolveUtilityState = <T,>(
  item: T,
  utilityAction: UtilityActionConfig<T> | undefined,
  theme: Theme,
  itemLabel?: string
) => {
  const hidden = resolveActionBoolean(utilityAction?.hideButton, item)
  const action = hidden ? undefined : utilityAction
  const exits = action ? resolveActionBoolean(action.exits, item) : true
  const defaultIcon = (
    <DefaultActionIcon theme={theme} type={exits ? 'delete' : 'reset'} />
  )

  return {
    action,
    hidden,
    variant: resolveActionVariant(action?.variant, item, 'danger'),
    ariaLabel: action
      ? resolveActionText(action.ariaLabel ?? action.label, item)
      : itemLabel
        ? `Delete ${itemLabel}`
        : 'Delete',
    disabled: action?.disabled?.(item) ?? false,
    exits,
    icon: resolveActionValue(action?.icon ?? defaultIcon, item) || defaultIcon,
  }
}

type ActionCardProps<T> = ActionCardContentProps<T> & {
  item: T
  index: number
  isItemHighlighted: boolean
  primaryDisabled: boolean
  getActionStyle: ActionStyleResolver<T>
  actionBaseStyle: CSSProperties
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
  const [resetRequested, setResetRequested] = useState(false)
  const [activityActionImage, setActivityActionImage] = useState<string | null>(
    null
  )
  const { pendingAction, actionError, runAction } = useAsyncAction<
    'primary' | 'edit' | 'utility'
  >()
  const { cardRef, isExiting, runWithExit } = useCardExitAnimation()
  const itemLabel = getItemLabel?.(item)
  const utility = resolveUtilityState(item, utilityAction, theme, itemLabel)
  // Every delete and reset uses the same inline confirmation controls.
  const confirmingReset = resetRequested && !utility.hidden

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
    await runWithExit(utility.exits, () =>
      runAction(utility.exits ? 'Delete' : 'Reset', 'utility', () =>
        (utility.action?.onClick ?? onDelete)(item)
      )
    )
  }

  useEffect(() => {
    if (!isInlineEditing) return
    cardRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [cardRef, isInlineEditing])

  const starCount = getStarCount?.(item)
  const hidePrimaryButton = resolveActionBoolean(primaryAction.hideButton, item)
  const hideEditButton = resolveActionBoolean(hideEdit, item)

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
    <StandardActionButtons
      item={item}
      theme={theme}
      primaryAction={
        activityActionImage
          ? {
              ...primaryAction,
              icon: (
                <img
                  src={activityActionImage}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  className="h-6 w-6 object-contain"
                />
              ),
            }
          : primaryAction
      }
      primaryDisabled={primaryDisabled}
      hidePrimary={hidePrimaryButton}
      hideEdit={hideEditButton}
      hideUtility={utility.hidden}
      onPrimary={handlePrimaryAction}
      onEdit={handleEditAction}
      editAriaLabel={itemLabel ? `Edit ${itemLabel}` : 'Edit item'}
      onUtility={() => setResetRequested(true)}
      confirmingReset={confirmingReset}
      confirmAriaLabel={utility.exits ? 'Yes, delete' : 'Yes, reset'}
      cancelAriaLabel={utility.exits ? 'No, keep' : 'No, keep progress'}
      onConfirmReset={() => {
        setResetRequested(false)
        void handleUtilityAction()
      }}
      onCancelReset={() => setResetRequested(false)}
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
      className={`whimsical-card ${hidePrimaryButton ? 'standard-card-primary-hidden' : ''} ${confirmingReset ? 'standard-card-confirming-reset' : ''} ${isExiting ? 'whimsical-card-exiting' : ''}`}
      header={renderHeader?.(item)}
      body={
        <ImageLoadingContext value={index === 0 ? 'eager' : 'lazy'}>
          <PrimaryActionImageContext value={setActivityActionImage}>
            <fieldset
              disabled={confirmingReset}
              style={{ display: 'contents' }}
            >
              {renderItem(item)}
            </fieldset>
          </PrimaryActionImageContext>
        </ImageLoadingContext>
      }
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

  if (inlineNewRow)
    return frameInlineNewRow ? (
      <CardShell theme={theme} variant="editing" body={inlineNewRow} />
    ) : (
      inlineNewRow
    )
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
          onClick={() => {
            void handleAdd()
          }}
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
  primaryAction,
  addLabel,
  onAdd,
  addDisabled = false,
  isLoading = false,
  emptyState,
  isHighlighted,
  inlineNewRow,
  frameInlineNewRow = true,
  hideAdd = false,
  ...cardProps
}: StandardActionListProps<T>) => {
  // Inject CSS animations on mount
  useEffect(() => {
    injectStandardActionStyles()
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
                {...cardProps}
                key={cardProps.getKey?.(item) ?? `${index}`}
                item={item}
                index={index}
                theme={theme}
                isItemHighlighted={isHighlighted?.(item) ?? false}
                primaryAction={primaryAction}
                primaryDisabled={primaryAction.disabled?.(item) ?? false}
                getActionStyle={getActionStyle}
                actionBaseStyle={actionBaseStyle}
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
