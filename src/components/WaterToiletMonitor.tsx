import StarDisplay from './ui/StarDisplay'
import {
  fallbackToiletVisuals,
  fallbackWaterVisuals,
  getToiletImage,
  getWaterImage,
  toiletLabels,
  waterLabels,
} from '../ui/waterToiletAssets'
import type { ToiletStatus, WaterLevel } from '../data/types'
import type { Theme } from '../contexts/ThemeContext'

type WaterToiletMonitorProps = {
  theme: Theme
  waterLevel: WaterLevel
  toiletStatus: ToiletStatus
  starDelta: number
  isInteractive: boolean
  isCompleted?: boolean
  onCycleWater?: () => void
  onCycleToilet?: () => void
}

const WaterToiletMonitor = ({
  theme,
  waterLevel,
  toiletStatus,
  starDelta,
  isInteractive,
  isCompleted = false,
  onCycleWater,
  onCycleToilet,
}: WaterToiletMonitorProps) => {
  const waterImage = getWaterImage(theme, waterLevel)
  const toiletImage = getToiletImage(theme, toiletStatus)

  const isActuallyInteractive = isInteractive && !isCompleted

  const tileStyle = {
    display: 'flex',
    minHeight: '176px',
    width: '100%',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '28px',
    border: `4px solid ${theme.colors.accent}`,
    background:
      theme.id === 'princess'
        ? `linear-gradient(180deg, ${theme.colors.surface} 0%, #FDF2F8 100%)`
        : theme.colors.surface,
    boxShadow:
      theme.id === 'princess'
        ? `0 10px 0 ${theme.colors.accent}, 0 14px 24px rgba(131, 24, 67, 0.12)`
        : `0 8px 20px ${theme.colors.primary}22`,
    padding: '16px',
    cursor: isActuallyInteractive ? 'pointer' : 'default',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    opacity: isCompleted ? 0.9 : 1,
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '14px',
        }}
      >
        <button
          type="button"
          onClick={onCycleWater}
          disabled={!isActuallyInteractive}
          aria-label={waterLabels[waterLevel]}
          style={tileStyle}
        >
          {waterImage ? (
            <img
              src={waterImage}
              alt={waterLabels[waterLevel]}
              style={{
                width: '100%',
                maxWidth: '108px',
                maxHeight: '108px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>
              {fallbackWaterVisuals[waterLevel]}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onCycleToilet}
          disabled={!isActuallyInteractive}
          aria-label={toiletLabels[toiletStatus]}
          style={tileStyle}
        >
          {toiletImage ? (
            <img
              src={toiletImage}
              alt={toiletLabels[toiletStatus]}
              style={{
                width: '100%',
                maxWidth: '108px',
                maxHeight: '108px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <span style={{ fontSize: '2.5rem' }}>
              {fallbackToiletVisuals[toiletStatus]}
            </span>
          )}
        </button>
      </div>

      <StarDisplay
        theme={theme}
        count={starDelta}
        animate={false}
        emptyContent={null}
      />
    </div>
  )
}

export default WaterToiletMonitor
