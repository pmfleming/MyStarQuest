import type { Theme } from '../../contexts/ThemeContext'
import type { LargeNumbersProblem } from '../../lib/largeNumbersProblems'
import {
  PLACE_VALUE_FACTORS,
  POSITIONAL_NOTATION_PLACES,
  type PlaceValueKind,
  type PlaceValues,
} from '../../lib/positionalNotationProblems'
import { PlaceValueColumn } from './PositionalNotationPlayArea'

type Props = {
  theme: Theme
  problem: LargeNumbersProblem
  difficulty: 'three-crowns' | 'four-crowns'
  values: PlaceValues
  isCorrect: boolean
  onChange: (kind: PlaceValueKind, value: number) => void
}

export default function LargeNumbersExpandedAnswer({
  theme,
  problem: { a, b, operation },
  difficulty,
  values,
  isCorrect,
  onChange,
}: Props) {
  const kinds = POSITIONAL_NOTATION_PLACES[difficulty]
  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: `24px repeat(${kinds.length}, minmax(0, 1fr))`,
    gap: 4,
    alignItems: 'center',
    textAlign: 'center',
  } as const

  return (
    <>
      <div
        role="group"
        aria-label={`${a} ${operation === '+' ? 'plus' : 'minus'} ${b}`}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `3px dashed ${theme.colors.primary}55`,
          borderRadius: 18,
          padding: 8,
          background: theme.colors.surface,
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        {[a, b].map((operand, index) => (
          <div key={index} style={rowStyle}>
            <span>{index === 1 ? (operation === '+' ? '+' : '−') : ''}</span>
            {kinds.map((kind) => (
              <span key={kind}>
                {operand < PLACE_VALUE_FACTORS[kind]
                  ? ''
                  : Math.floor(operand / PLACE_VALUE_FACTORS[kind]) % 10}
              </span>
            ))}
          </div>
        ))}
        <div
          role="group"
          aria-label="Your answer"
          style={{
            ...rowStyle,
            borderTop: `3px solid ${theme.colors.text}`,
            marginTop: 4,
            paddingTop: 4,
            color: theme.colors.primary,
          }}
        >
          <span>=</span>
          {kinds.map((kind) => (
            <span key={kind}>{values[kind]}</span>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 4,
          width: '100%',
        }}
      >
        {kinds.map((kind) => (
          <PlaceValueColumn
            key={kind}
            kind={kind}
            value={values[kind]}
            max={9}
            compact
            expanded
            isCorrect={isCorrect}
            theme={theme}
            onChange={(value) => onChange(kind, value)}
          />
        ))}
      </div>
    </>
  )
}
