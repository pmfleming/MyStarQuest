import { memo, type CSSProperties, type RefObject } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { uiTokens } from '../../tokens'
import { explorerUi } from './dayNightExplorer.constants.ts'
import type {
  ExplorerFocusId,
  ExplorerFocusOption,
} from './dayNightExplorerOptions'

type SpinningPlanetProps = {
  theme: Theme
  globeReady: boolean
  globeFailed: boolean
  retryGlobe: () => void
  canvasRef: RefObject<HTMLCanvasElement | null>
  options: ExplorerFocusOption[]
  activeFocusId: ExplorerFocusId
  onSelect: (focusId: ExplorerFocusId) => void
}

const SpinningPlanet = memo(
  ({
    theme,
    globeReady,
    globeFailed,
    retryGlobe,
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
            className="dne-glass-nav dne-glass-nav--overlay"
            role="group"
            aria-label="Globe views"
            style={
              {
                '--dne-nav-accent': theme.colors.accent,
                background: `${theme.colors.accent}14`,
                border: `1px solid ${theme.colors.accent}33`,
                borderRadius: uiTokens.listItemRadius,
              } as CSSProperties
            }
          >
            <div className="dne-glass-nav__stack">
              {options.map((option) => {
                const isActive = option.id === activeFocusId
                const isViewToggle =
                  option.id === 'sun' || option.id === 'earth'

                return (
                  <button
                    key={option.id}
                    type="button"
                    className="dne-glass-nav__button"
                    data-highlighted={isActive || isViewToggle}
                    aria-label={`Show ${option.label} view`}
                    title={option.label}
                    aria-pressed={isActive}
                    onClick={() => onSelect(option.id)}
                  >
                    <img
                      src={option.icon}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: `${explorerUi.locationButtonSize}px`,
                        height: `${explorerUi.locationButtonSize}px`,
                        objectFit: 'contain',
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="dne-planet-viewport"
            style={{
              width: '100%',
              height: explorerUi.globeCanvasSize,
              borderRadius: explorerUi.clockFaceRadius,
              overflow: 'hidden',
              background: '#1e3799',
              boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.3), 0 0 0 4px ${theme.colors.accent}`,
              position: 'relative',
              opacity: globeReady ? 1 : 0.6,
              transition: 'opacity 0.5s ease',
            }}
          >
            <canvas
              className="dne-planet-canvas"
              data-no-drag-scroll="true"
              aria-label="3D Earth. In the Sun view, drag Earth around its orbit to change the calendar date."
              ref={canvasRef}
              width={explorerUi.globeCanvasSize}
              height={explorerUi.globeCanvasSize}
              style={{
                pointerEvents: 'auto',
              }}
            />
            {!globeReady && (
              <div
                role="status"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
              >
                {globeFailed ? (
                  <>
                    <span>The globe couldn’t load.</span>
                    <button
                      type="button"
                      onClick={retryGlobe}
                      className="rounded-lg border border-white px-4 py-2"
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  'Opening the globe…'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

export default SpinningPlanet
