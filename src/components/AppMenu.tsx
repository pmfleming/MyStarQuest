import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useActiveChild } from '../contexts/ActiveChildContext'
import type { Theme } from '../contexts/ThemeContext'
import { useChores } from '../data/useChores'
import { isEatingTask } from '../data/types'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { getThemeAsset } from '../ui/themeAssets'
import { getThemeActionIcon } from '../ui/themeActionAssets'
import { AsyncButton } from './ui/AsyncButton'
import './AppMenu.css'

type AppMenuProps = {
  theme: Theme
  onResetToday?: () => Promise<void>
}

type ResetButtonProps = {
  disabled: boolean
  busy: boolean
  style: CSSProperties
  icon: string | undefined
  runReset: (action: () => Promise<void>) => Promise<void>
}

// Only subscribe to chores on other tabs while the menu is open.
const OtherTabResetButton = (props: ResetButtonProps) => {
  const { todos, resetDinner, resetChore } = useChores()
  return (
    <ResetButton
      {...props}
      disabled={props.disabled || todos.length === 0}
      onReset={async () => {
        const results = await Promise.allSettled(
          todos.map((chore) =>
            isEatingTask(chore) ? resetDinner(chore) : resetChore(chore)
          )
        )
        const failure = results.find((result) => result.status === 'rejected')
        if (failure) throw failure.reason
      }}
    />
  )
}

const ResetButton = ({
  disabled,
  busy,
  style,
  icon,
  runReset,
  onReset,
}: ResetButtonProps & { onReset: () => Promise<void> }) => (
  <AsyncButton
    aria-label="Reset today"
    aria-busy={busy}
    disabled={disabled}
    style={style}
    onClick={() => runReset(onReset)}
  >
    {icon ? (
      <img src={icon} alt="" width={36} height={36} />
    ) : (
      <span aria-hidden="true">↻</span>
    )}
    {busy ? 'Resetting today…' : 'Reset today'}
  </AsyncButton>
)

const MenuSheet = ({
  theme,
  onResetToday,
  id,
  onDismiss,
}: AppMenuProps & { id: string; onDismiss: () => void }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { activeChildId } = useActiveChild()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { pendingAction, actionError, runAction } = useAsyncAction<
    'reset' | 'signout'
  >()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  const dismiss = () => {
    if (!pendingAction) onDismiss()
  }
  const actionStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    minHeight: 64,
    padding: '12px 16px',
    border: `1px solid ${theme.colors.accent}66`,
    borderRadius: 18,
    background: theme.colors.bg,
    color: theme.colors.text,
    fontSize: '1.1rem',
    fontWeight: 700,
    textAlign: 'left',
  }
  const resetProps: ResetButtonProps = {
    disabled: !activeChildId || pendingAction !== null,
    busy: pendingAction === 'reset',
    style: actionStyle,
    icon: getThemeActionIcon(theme.id, 'reset'),
    runReset: async (action) => {
      if (await runAction('Reset today', 'reset', action)) onDismiss()
    },
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      id={id}
      className="app-menu-sheet"
      aria-labelledby={`${id}-title`}
      style={{
        background: theme.colors.surface,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        borderColor: `${theme.colors.accent}66`,
      }}
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onClose={(event) => {
        // StrictMode can reopen the dialog before a cleanup's close event arrives.
        if (!event.currentTarget.open) onDismiss()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)'
        )
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (!first || !last) {
          event.preventDefault()
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dismiss()
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          id={`${id}-title`}
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          Menu
        </h2>
        <AsyncButton
          aria-label="Close menu"
          disabled={pendingAction !== null}
          onClick={dismiss}
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ color: theme.colors.primary, fontSize: 30 }}
        >
          <span aria-hidden="true">×</span>
        </AsyncButton>
      </div>
      <div className="flex flex-col gap-3">
        <AsyncButton
          disabled={pendingAction !== null}
          style={actionStyle}
          onClick={() => {
            onDismiss()
            return navigate('/settings/manage-children')
          }}
        >
          {getThemeAsset(theme.id, 'childrenIcon') ? (
            <img
              src={getThemeAsset(theme.id, 'childrenIcon')}
              alt=""
              width={36}
              height={36}
            />
          ) : (
            <span aria-hidden="true">👥</span>
          )}
          Children
        </AsyncButton>
        {onResetToday ? (
          <ResetButton {...resetProps} onReset={onResetToday} />
        ) : (
          <OtherTabResetButton {...resetProps} />
        )}
        <AsyncButton
          aria-label="Sign out"
          disabled={pendingAction !== null}
          style={actionStyle}
          onClick={async () => {
            if (await runAction('Sign out', 'signout', logout)) onDismiss()
          }}
        >
          {getThemeAsset(theme.id, 'exitIcon') ? (
            <img
              src={getThemeAsset(theme.id, 'exitIcon')}
              alt=""
              width={36}
              height={36}
            />
          ) : (
            <span aria-hidden="true">↪</span>
          )}
          {pendingAction === 'signout' ? 'Signing out…' : 'Sign out'}
        </AsyncButton>
        {actionError && <p role="alert">{actionError}</p>}
      </div>
    </dialog>,
    document.body
  )
}

const AppMenu = (props: AppMenuProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const id = useId()
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])
  return (
    <>
      <AsyncButton
        ref={triggerRef}
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95"
        style={{
          background: `${props.theme.colors.primary}20`,
          color: props.theme.colors.primary,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </AsyncButton>
      {open && (
        <MenuSheet {...props} id={id} onDismiss={() => setOpen(false)} />
      )}
    </>
  )
}

export default AppMenu
