import type { RefObject } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { explorerUi } from '../../data/dayNightExplorer/dayNightExplorer.constants'

type ExplorerGlobeProps = {
  theme: Theme
  globeReady: boolean
  isInteractive: boolean
  canvasRef: RefObject<HTMLCanvasElement | null>
}

const ExplorerGlobe = ({
  theme,
  globeReady,
  isInteractive,
  canvasRef,
}: ExplorerGlobeProps) => {
  return (
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
      }}
    >
      <canvas
        ref={canvasRef}
        width={explorerUi.globeCanvasSize}
        height={explorerUi.globeCanvasSize}
        style={{
          display: 'block',
          cursor: isInteractive ? 'grab' : 'default',
          pointerEvents: isInteractive ? 'auto' : 'none',
        }}
      />
    </div>
  )
}

export default ExplorerGlobe
