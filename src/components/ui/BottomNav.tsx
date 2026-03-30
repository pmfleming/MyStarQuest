import { useNavigate } from 'react-router-dom'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { appTabs, getTabIcon, type AppTabId } from '../../lib/tabNavigation'

interface BottomNavProps {
  theme: Theme
  activeTabId: AppTabId
}

const BottomNav = ({ theme, activeTabId }: BottomNavProps) => {
  const navigate = useNavigate()

  return (
    <nav
      aria-label="Primary tabs"
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${uiTokens.floatingNavWidthPercent}%`,
        maxWidth: `${uiTokens.floatingNavMaxWidth}px`,
        height: `${uiTokens.floatingNavHeight}px`,
        display: 'grid',
        gridTemplateColumns: `repeat(${appTabs.length}, minmax(0, 1fr))`,
        gap: '8px',
        padding: '0 12px',
        // Translucent background with glassmorphism
        background: `${theme.colors.surface}99`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '32px',
        border: `2px solid ${theme.colors.accent}44`,
        boxShadow: `0 12px 32px ${theme.colors.primary}33`,
        zIndex: 100,
      }}
    >
      {appTabs.map((tab) => {
        const isActive = tab.id === activeTabId

        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: `${uiTokens.topIconSize}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 200ms ease, opacity 200ms ease',
              opacity: isActive ? 1 : 0.6,
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
              position: 'relative',
              padding: 0,
            }}
          >
            <img
              src={getTabIcon(tab.id)}
              alt=""
              aria-hidden="true"
              style={{
                width: `${uiTokens.topIconSize}px`,
                height: `${uiTokens.topIconSize}px`,
                objectFit: 'contain',
                filter: isActive
                  ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))'
                  : 'none',
              }}
            />
          </button>
        )
      })}
    </nav>
  )
}

export default BottomNav
