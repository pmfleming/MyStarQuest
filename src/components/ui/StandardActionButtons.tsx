import { getActionButtonState } from './actionButtonState'
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import {
  getThemeActionIcon,
  type ThemeActionIcon,
} from '../../ui/themeActionAssets'
import { uiTokens } from '../../tokens'
import { ActionArtwork } from './ActionArtwork'
import { getThemeAsset } from '../../ui/themeAssets'
import {
  getStandardActionBaseStyle,
  getStandardActionVariantStyle,
} from './standardActionStyles'
import type {
  ResolvedListAction,
  ActionVariant,
  CardUtilityPresentation,
} from './standardActionListTypes'

export const DefaultActionIcon = ({
  theme,
  type,
}: {
  theme: Theme
  type: ThemeActionIcon
}) => {
  const artwork = getThemeActionIcon(theme.id, type)
  if (!artwork) {
    return <span>{{ edit: '✏️', delete: '🗑️', reset: '↻' }[type]}</span>
  }

  return (
    <img
      src={artwork}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={
        type === 'reset'
          ? 'h-6 w-6 object-contain'
          : 'h-full w-full object-contain'
      }
    />
  )
}

export const ActionSpinner = () => (
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

type UtilityButtonProps = {
  ariaLabel: string
  icon: ReactNode
  onClick: () => void | Promise<unknown>
  style: CSSProperties
  disabled?: boolean
  isDanger?: boolean
  isPending?: boolean
  describedBy?: string
  buttonRef?: Ref<HTMLButtonElement>
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
  buttonRef,
}: UtilityButtonProps) => (
  <button
    ref={buttonRef}
    type="button"
    onClick={() => {
      void onClick()
    }}
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
          width: `${uiTokens.listUtilityArtworkSize}px`,
          height: `${uiTokens.listUtilityArtworkSize}px`,
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

type StandardActionButtonsProps<T> = {
  theme: Theme
  primaryAction: ResolvedListAction<T>
  utility: CardUtilityPresentation
  onPrimary: () => void | Promise<unknown>
  onEdit?: () => void | Promise<unknown>
  editAriaLabel: string
  onUtility: () => void | Promise<void>
  pendingAction: 'primary' | 'edit' | 'utility' | null
  errorId?: string
  confirmingReset: boolean
  onConfirmReset: () => void
  onCancelReset: () => void
}

type UtilityChoice = Omit<UtilityButtonProps, 'style'> & {
  key: string
  variant: ActionVariant
}

export const StandardActionButtons = <T,>({
  theme,
  primaryAction,
  utility,
  onPrimary,
  onEdit,
  editAriaLabel,
  onUtility,
  pendingAction,
  errorId,
  confirmingReset,
  onConfirmReset,
  onCancelReset,
}: StandardActionButtonsProps<T>) => {
  const actionBaseStyle = getStandardActionBaseStyle(theme)
  const getActionStyle = (variant: ActionVariant) =>
    getStandardActionVariantStyle(theme, variant)
  const resetButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const restoreResetFocus = useRef(false)
  useEffect(() => {
    if (confirmingReset) {
      restoreResetFocus.current = true
      cancelButton.current?.focus()
    } else if (
      restoreResetFocus.current &&
      !pendingAction &&
      !utility.disabled
    ) {
      resetButton.current?.focus()
      restoreResetFocus.current = false
    }
  }, [confirmingReset, pendingAction, utility.disabled])
  const utilityStyle = {
    ...actionBaseStyle,
    width: `${uiTokens.listUtilityActionWidth}px`,
    minWidth: `${uiTokens.listUtilityActionWidth}px`,
    padding: 0,
  }
  const state = getActionButtonState({
    hidePrimary: Boolean(primaryAction.hideButton),
    hasEdit: Boolean(onEdit),
    hideUtility: utility.hidden,
    confirmingReset,
    pendingAction,
    primaryDisabled: Boolean(primaryAction.disabled),
    utilityDisabled: utility.disabled,
  })
  const columns = [
    state.showPrimary && 'minmax(0, 1fr)',
    state.utilityColumns > 0 &&
      `repeat(${state.utilityColumns}, ${uiTokens.listUtilityActionWidth}px)`,
  ]
    .filter(Boolean)
    .join(' ')
  const utilityButtons: UtilityChoice[] = state.confirm
    ? [
        {
          key: 'confirm',
          ariaLabel: utility.confirmLabel,
          icon: (
            <img
              src={getThemeAsset(theme.id, 'confirmExitImage')}
              alt=""
              className="h-full w-full object-contain"
            />
          ),
          onClick: onConfirmReset,
          disabled: state.utilityDisabled,
          variant: 'neutral',
        },
        {
          key: 'cancel',
          ariaLabel: utility.cancelLabel,
          icon: (
            <img
              src={getThemeAsset(theme.id, 'continueActivityImage')}
              alt=""
              className="h-full w-full object-contain"
            />
          ),
          onClick: onCancelReset,
          disabled: state.cancelDisabled,
          variant: 'neutral',
        },
      ]
    : [
        {
          key: 'utility',
          ariaLabel: utility.ariaLabel,
          icon: utility.icon,
          onClick: onUtility,
          disabled: state.utilityDisabled,
          variant: utility.variant,
          isDanger: utility.variant === 'danger',
          isPending: pendingAction === 'utility',
          describedBy: errorId,
        },
      ]

  return (
    <div
      data-action-theme={theme.id}
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        alignItems: 'stretch',
        gap: `${uiTokens.actionRowGap}px`,
        justifyContent: primaryAction.hideButton ? 'flex-end' : undefined,
        minHeight: `${uiTokens.listActionHeight}px`,
      }}
    >
      {state.showPrimary && (
        <button
          type="button"
          onClick={() => {
            void onPrimary()
          }}
          disabled={state.primaryDisabled}
          className="whimsical-btn disabled:opacity-60"
          aria-label={primaryAction.ariaLabel ?? primaryAction.label}
          aria-busy={pendingAction === 'primary' || undefined}
          aria-describedby={errorId}
          style={{
            ...actionBaseStyle,
            ...getActionStyle(primaryAction.variant ?? 'primary'),
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
            height: '100%',
            minHeight: `${uiTokens.listActionHeight}px`,
            filter: confirmingReset ? 'grayscale(1)' : undefined,
          }}
        >
          {pendingAction === 'primary' ? (
            <ActionSpinner />
          ) : (
            <ActionArtwork>{primaryAction.icon ?? '⭐'}</ActionArtwork>
          )}
        </button>
      )}
      {state.showEdit && onEdit && (
        <UtilityButton
          ariaLabel={editAriaLabel}
          icon={<DefaultActionIcon theme={theme} type="edit" />}
          onClick={onEdit}
          style={{ ...utilityStyle, ...getActionStyle('neutral') }}
          disabled={state.editDisabled}
          isPending={pendingAction === 'edit'}
          describedBy={errorId}
        />
      )}
      {state.showUtility &&
        utilityButtons.map(({ key, variant, ...button }) => (
          <UtilityButton
            key={key}
            buttonRef={
              state.confirm
                ? key === 'cancel'
                  ? cancelButton
                  : undefined
                : resetButton
            }
            {...button}
            style={{ ...utilityStyle, ...getActionStyle(variant) }}
          />
        ))}
    </div>
  )
}
