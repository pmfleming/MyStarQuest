import type { RefObject } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { explorerUi } from '../../lib/dayNightExplorer/dayNightExplorer.constants'
import type {
  ExplorerFocusId,
  ExplorerFocusOption,
  ExplorerRenderMode,
} from '../../lib/dayNightExplorer/dayNightExplorerOptions'

type SpinningPlanetProps = {
  theme: Theme
  globeReady: boolean
  renderMode: ExplorerRenderMode
  canvasRef: RefObject<HTMLCanvasElement | null>
  options: ExplorerFocusOption[]
  activeFocusId: ExplorerFocusId
  onSelect: (focusId: ExplorerFocusId) => void
}

const SpinningPlanet = ({
  theme,
  globeReady,
  renderMode,
  canvasRef,
  options,
  activeFocusId,
  onSelect,
}: SpinningPlanetProps) => {
  return (
    <div
      className="dne-planet-card"
      style={{
        background: theme.colors.surface,
        border: `${uiTokens.listItemBorderWidth}px solid ${theme.colors.accent}`,
        borderRadius: explorerUi.clockFaceRadius,
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div className="dne-globe-container">
        <div
          className="dne-location-glass-nav"
          style={{
            background: `${theme.colors.surface}99`,
            border: `2px solid ${theme.colors.accent}44`,
            borderRadius: uiTokens.listItemRadius,
          }}
        >
          <div className="dne-location-overlay">
            {options.map((option) => {
              const isActive = option.id === activeFocusId

              return (
                <button
                  key={option.id}
                  type="button"
                  className="dne-location-button"
                  aria-label={`Show ${option.label} view`}
                  aria-pressed={isActive}
                  onClick={() => onSelect(option.id)}
                  style={{
                    opacity: isActive ? 1 : 0.6,
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  <img
                    src={option.icon}
                    alt=""
                    aria-hidden="true"
                    style={{
                      width: `${explorerUi.locationButtonSize}px`,
                      height: `${explorerUi.locationButtonSize}px`,
                      objectFit: 'contain',
                      filter: isActive
                        ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))'
                        : 'none',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            width: explorerUi.globeCanvasSize,
            height: explorerUi.globeCanvasSize,
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#1e3799',
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px ${theme.colors.accent}`,
            position: 'relative',
            opacity: globeReady ? 1 : 0.6,
            transition: 'opacity 0.5s ease',
            margin: '0 auto',
            transform: 'translateX(20px)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={explorerUi.globeCanvasSize}
            height={explorerUi.globeCanvasSize}
            style={{
              display: 'block',
              cursor: renderMode === 'rotating-earth' ? 'grab' : 'default',
              pointerEvents: renderMode === 'rotating-earth' ? 'auto' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default SpinningPlanet
