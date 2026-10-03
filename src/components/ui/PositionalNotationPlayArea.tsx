import type { CSSProperties } from 'react'
import type { Theme } from '../../contexts/ThemeContext'
import { type ActivityResult } from '../../lib/activityOutcome'
import { uiTokens } from '../../tokens'
import { getThemeAsset } from '../../ui/themeAssets'
import { EmptyCounterHint, MathCounter, TenRod } from './ActivityMathCounters'
import MathActivityPlayArea from './MathActivityPlayArea'
import { NumberStepper } from './StepperButton'

export type PlaceValueKind = 'hundreds' | 'tens' | 'ones'
export type PlaceValues = Record<PlaceValueKind, number>

type PositionalNotationPlayAreaProps = {
  theme: Theme
  targetNumber: number
  values: PlaceValues
  maxTens: number
  isTwoCrown: boolean
  isCorrect: boolean
  isWrong: boolean
  retryCount: number
  results: ActivityResult[]
  onChange: (kind: PlaceValueKind, value: number) => void
}

const { mathCounterSize, mathCounterGap } = uiTokens.activityTokens
const MAX_DIGIT = 9
const STEPPER_HEIGHT = 44

const PLACE_VALUE_DETAILS = {
  hundreds: {
    label: 'Hundreds',
    factor: 100,
    color: 'accent',
    width: 30,
    fontSize: '1rem',
    valueWidth: undefined,
    minValueWidth: 34,
    gap: 2,
    padding: undefined,
  },
  tens: {
    label: 'Tens',
    factor: 10,
    color: 'secondary',
    width: 40,
    fontSize: '1.2rem',
    valueWidth: 42,
    minValueWidth: undefined,
    gap: 4,
    padding: undefined,
  },
  ones: {
    label: 'Ones',
    factor: 1,
    color: 'primary',
    width: 30,
    fontSize: '1rem',
    valueWidth: 24,
    minValueWidth: undefined,
    gap: 2,
    padding: 4,
  },
} as const

const CounterCollection = ({
  kind,
  value,
  color,
  theme,
  compact,
}: {
  kind: PlaceValueKind
  value: number
  color: string
  theme: Theme
  compact: boolean
}) => {
  if (value === 0) {
    return <EmptyCounterHint color={color} fontFamily={theme.fonts.body} />
  }

  if (kind === 'hundreds') {
    return Array.from({ length: value }, (_, index) => (
      <div
        key={`hundred-${index}`}
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          border: `2px solid ${color}`,
          borderRadius: 4,
          backgroundColor: `${color}18`,
          backgroundImage: `url("${getThemeAsset(theme.id, 'placeValueCounter')}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '10% 10%',
          animation: `pv-pop-in 0.3s cubic-bezier(0.175,0.885,0.32,1.275) ${index * 0.05}s both`,
        }}
      />
    ))
  }

  if (kind === 'tens') {
    return Array.from({ length: value }, (_, index) => (
      <TenRod
        key={`ten-${index}`}
        src={getThemeAsset(theme.id, 'placeValueCounter')}
        counterSize={compact ? 5 : 12}
        delay={index * 0.05}
        animationName="pv-pop-in"
        borderColor={color}
        gap={compact ? 0 : 1}
      />
    ))
  }

  const counterSize = compact ? 24 : Math.max(mathCounterSize + 12, 30)
  return Array.from({ length: value }, (_, index) => (
    <MathCounter
      key={`one-${index}`}
      src={getThemeAsset(theme.id, 'placeValueCounter')}
      alt=""
      size={counterSize}
      delay={index * 0.05}
      animationName="pv-pop-in"
    />
  ))
}

const getCounterLayout = (
  kind: PlaceValueKind,
  compact: boolean
): CSSProperties => {
  const base: CSSProperties = {
    justifyContent: 'center',
    minHeight: compact ? 112 : 100,
    width: '100%',
  }

  if (kind === 'ones') {
    return {
      ...base,
      display: 'flex',
      flexWrap: 'wrap',
      alignContent: 'center',
      alignItems: 'center',
      paddingBottom: 4,
      gap: mathCounterGap,
      boxSizing: 'border-box',
    }
  }

  return {
    ...base,
    display: 'grid',
    gridTemplateColumns:
      kind === 'hundreds'
        ? 'repeat(3, max-content)'
        : `repeat(${compact ? 3 : 6}, max-content)`,
    alignContent: 'center',
    alignItems: kind === 'tens' ? 'flex-end' : undefined,
    columnGap: kind === 'tens' ? mathCounterGap : 2,
    rowGap: kind === 'tens' ? mathCounterGap : 2,
    paddingBottom: kind === 'tens' ? 4 : undefined,
  }
}

const PlaceValueColumn = ({
  kind,
  value,
  max,
  compact,
  isCorrect,
  theme,
  onChange,
}: {
  kind: PlaceValueKind
  value: number
  max: number
  compact: boolean
  isCorrect: boolean
  theme: Theme
  onChange: (value: number) => void
}) => {
  const details = PLACE_VALUE_DETAILS[kind]
  const color = theme.colors[details.color]
  const stepperWidth = compact ? 28 : details.width
  const unitLabel = details.label.toLowerCase().slice(0, -1)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: `${color}12`,
        borderRadius: 16,
        padding: compact ? 4 : 8,
        border: `2px solid ${color}22`,
        boxSizing: 'border-box',
        width: '100%',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: compact ? 15 : 18,
          fontWeight: 'bold',
          fontFamily: theme.fonts.heading,
          color,
          marginBottom: 6,
        }}
      >
        {details.label}
      </span>
      <NumberStepper
        theme={theme}
        value={value * details.factor}
        disabled={isCorrect}
        decrease={{
          onClick: () => onChange(Math.max(0, value - 1)),
          disabled: value === 0,
          ariaLabel: `Remove ${unitLabel}`,
        }}
        increase={{
          onClick: () => onChange(Math.min(max, value + 1)),
          disabled: value === max,
          ariaLabel: `Add ${unitLabel}`,
        }}
        buttonStyle={{
          width: stepperWidth,
          minWidth: stepperWidth,
          height: STEPPER_HEIGHT,
          fontSize: compact ? '0.9rem' : details.fontSize,
          flexShrink: 0,
        }}
        style={{
          gap: details.gap,
          marginBottom: 8,
          width: '100%',
          paddingInline: details.padding,
          boxSizing: 'border-box',
        }}
        valueStyle={{
          fontSize: compact ? 19 : 24,
          fontWeight: 'bold',
          color,
          minWidth: details.minValueWidth,
          width: details.valueWidth,
          flexShrink: 0,
        }}
      />
      <div style={getCounterLayout(kind, compact)}>
        <CounterCollection
          kind={kind}
          value={value}
          color={color}
          theme={theme}
          compact={compact}
        />
      </div>
    </div>
  )
}

const TargetNumber = ({
  targetNumber,
  theme,
}: {
  targetNumber: number
  theme: Theme
}) => (
  <div
    style={{
      background: theme.colors.surface,
      border: `3px dashed ${theme.colors.primary}33`,
      borderRadius: 16,
      padding: '8px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      width: '100%',
      boxSizing: 'border-box',
      marginBottom: 4,
    }}
  >
    <span
      style={{
        fontSize: 48,
        fontWeight: 900,
        fontFamily: theme.fonts.heading,
        color: theme.colors.primary,
        lineHeight: 1,
      }}
    >
      {targetNumber}
    </span>
  </div>
)

const PositionalNotationPlayArea = ({
  theme,
  targetNumber,
  values,
  maxTens,
  isTwoCrown,
  isCorrect,
  isWrong,
  retryCount,
  results,
  onChange,
}: PositionalNotationPlayAreaProps) => {
  const kinds: PlaceValueKind[] = isTwoCrown
    ? ['hundreds', 'tens', 'ones']
    : ['tens', 'ones']
  const maxByKind: PlaceValues = {
    hundreds: MAX_DIGIT,
    tens: maxTens,
    ones: MAX_DIGIT,
  }
  const plusPositions = isTwoCrown ? ['33.33%', '66.66%'] : ['56.66%']
  return (
    <MathActivityPlayArea
      theme={theme}
      results={results}
      animationPrefix="pv"
      isCorrect={isCorrect}
      isWrong={isWrong}
      retryCount={retryCount}
    >
      <TargetNumber targetNumber={targetNumber} theme={theme} />
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isTwoCrown
              ? 'repeat(3, minmax(0, 1fr))'
              : '1.7fr 1.3fr',
            gap: 2,
            width: '100%',
            alignItems: 'stretch',
          }}
        >
          {kinds.map((kind) => (
            <PlaceValueColumn
              key={kind}
              kind={kind}
              value={values[kind]}
              max={maxByKind[kind]}
              compact={isTwoCrown}
              isCorrect={isCorrect}
              theme={theme}
              onChange={(value) => onChange(kind, value)}
            />
          ))}
        </div>
        {plusPositions.map((left) => (
          <div
            key={left}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: isTwoCrown ? 32 : 42,
              height: isTwoCrown ? 32 : 42,
              borderRadius: isTwoCrown ? 10 : 12,
              background: theme.colors.surface,
              border: `2px solid ${theme.colors.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.fonts.heading,
              fontSize: isTwoCrown ? 20 : 24,
              fontWeight: 900,
              color: theme.colors.primary,
              boxShadow: `0 4px 10px ${theme.colors.primary}22`,
              opacity: 0.92,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            +
          </div>
        ))}
      </div>
    </MathActivityPlayArea>
  )
}

export default PositionalNotationPlayArea
