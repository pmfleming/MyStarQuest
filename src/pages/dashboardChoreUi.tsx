import type { Theme } from '../contexts/ThemeContext'
import TopIconButton from '../components/ui/TopIconButton'
import { getThemeAsset, hasIllustratedTheme } from '../ui/themeAssets'
import { getThemeActionIcon } from '../ui/themeActionAssets'

const getHeaderAssets = (themeId: string) => {
  if (hasIllustratedTheme(themeId)) {
    return {
      switchProfileIcon: getThemeAsset(themeId, 'childrenIcon'),
      exitIcon: getThemeAsset(themeId, 'exitIcon'),
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
  const themeAssets = getHeaderAssets(theme.id)
  const resetIcon = getThemeActionIcon(theme.id, 'reset')

  return (
    <>
      <TopIconButton
        theme={theme}
        onClick={onResetToday}
        disabled={!activeChildId || isResettingToday}
        ariaLabel="Reset today"
        icon={
          <img
            src={resetIcon}
            alt="Reset today"
            decoding="async"
            className="h-10 w-10 object-contain"
          />
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
