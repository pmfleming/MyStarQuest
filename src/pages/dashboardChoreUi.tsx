import type { Theme } from '../contexts/ThemeContext'
import TopIconButton from '../components/ui/TopIconButton'
import {
  princessChildrenIcon,
  princessExitIcon,
  princessResetIcon,
} from '../assets/themes/princess/assets'

const getThemeAssets = (themeId: string) => {
  if (themeId === 'princess') {
    return {
      switchProfileIcon: princessChildrenIcon,
      exitIcon: princessExitIcon,
    }
  }

  return {
    switchProfileIcon: null,
    exitIcon: null,
  }
}

type DashboardHeaderActionsProps = {
  theme: Theme
  activeChildId: string | null
  isResettingToday: boolean
  onResetToday: () => void
  onLogout: () => void
}

export const DashboardHeaderActions = ({
  theme,
  activeChildId,
  isResettingToday,
  onResetToday,
  onLogout,
}: DashboardHeaderActionsProps) => {
  const themeAssets = getThemeAssets(theme.id)

  return (
    <>
      <TopIconButton
        theme={theme}
        onClick={onResetToday}
        disabled={!activeChildId || isResettingToday}
        ariaLabel="Reset today"
        icon={
          theme.id === 'princess' ? (
            <img
              src={princessResetIcon}
              alt="Reset today"
              decoding="async"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-2xl" role="img" aria-hidden="true">
              R
            </span>
          )
        }
      />
      <TopIconButton
        theme={theme}
        to="/settings/manage-children"
        ariaLabel="Children"
        icon={
          themeAssets.switchProfileIcon ? (
            <img
              src={themeAssets.switchProfileIcon}
              alt="Children"
              decoding="async"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-2xl">U</span>
          )
        }
      />
      <TopIconButton
        theme={theme}
        onClick={onLogout}
        ariaLabel="Exit"
        icon={
          themeAssets.exitIcon ? (
            <img
              src={themeAssets.exitIcon}
              alt="Exit"
              decoding="async"
              style={{
                width: 30,
                height: 30,
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <span className="text-2xl">X</span>
          )
        }
      />
    </>
  )
}
