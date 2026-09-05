import type { CSSProperties, ReactNode } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import {
  getThemeActionIcon,
  type ThemeActionIcon,
} from '../../ui/themeActionAssets'
import { uiTokens } from '../../tokens'
import type {
  ActionConfig,
  ActionStyleResolver,
  ActionVariant,
} from './standardActionListTypes'
import {
  resolveActionText,
  resolveActionValue,
  resolveActionVariant,
} from './standardActionConfig'

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
  getActionStyle: ActionStyleResolver<T>
  pendingAction: 'primary' | 'edit' | 'utility' | null
  errorId?: string
}

export const StandardActionButtons = <T,>({
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
}: StandardActionButtonsProps<T>) => {
  const utilityStyle = {
    ...actionBaseStyle,
    width: `${uiTokens.listUtilityActionWidth}px`,
    minWidth: `${uiTokens.listUtilityActionWidth}px`,
    padding: 0,
  }
  const primaryVariant = resolveActionVariant(
    primaryAction.variant,
    item,
    'primary'
  )
  const anyPending = pendingAction !== null

  return (
    <div
      data-action-theme={theme.id}
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
          aria-label={resolveActionText(
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
              {resolveActionValue(primaryAction.icon ?? '⭐', item)}
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
