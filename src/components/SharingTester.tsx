import { useCallback, useRef, useState, type CSSProperties } from 'react'
import type { SharingDifficulty } from '../data/types'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import {
  generateSharingProblem,
  isSharingAnswerCorrect,
  sharingProblemKey,
  type SharingProblem,
} from '../lib/sharingProblems'
import { getThemeAsset } from '../ui/themeAssets'
import type { ActivityChoreProps } from './ui/ActivityControls'
import { MathCounter } from './ui/ActivityMathCounters'
import CrownDifficultyControl from './ui/CrownDifficultyControl'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import MathActivityShell from './ui/MathActivityShell'
import { NumberStepper } from './ui/StepperButton'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
import './SharingTester.css'

export interface SharingTesterProps extends ActivityChoreProps {
  difficulty?: SharingDifficulty
  onDifficultyChange?: (difficulty: SharingDifficulty) => void | Promise<void>
}

const EMPTY_PROBLEM: SharingProblem = { total: 0, containers: 0 }
const DIFFICULTIES = [
  { value: 'easy' as const, label: 'Easy', crowns: 1 },
  { value: 'hard' as const, label: 'Hard', crowns: 2 },
  { value: 'mixed' as const, label: 'Mixed: 2, 3 or 4 containers', crowns: 3 },
]

export default function SharingTester(props: SharingTesterProps) {
  const { theme, isRunning, difficulty = 'easy', onDifficultyChange } = props
  const [problem, setProblem] = useState(EMPTY_PROBLEM)
  const [counts, setCounts] = useState<number[]>([])
  const seen = useRef(new Set<string>())
  const nextProblem = useCallback(() => {
    const next = generateSharingProblem(difficulty, seen.current)
    // Keep insertion order in recency order when the small question pool cycles.
    seen.current.delete(sharingProblemKey(next))
    seen.current.add(sharingProblemKey(next))
    setProblem(next)
    setCounts(Array(next.containers).fill(0))
  }, [difficulty])
  const resetProblem = useCallback(() => {
    seen.current.clear()
    setProblem(EMPTY_PROBLEM)
    setCounts([])
  }, [])
  const challenge = useCheckedActivityChallenge({
    ...props,
    canStart: problem.total === 0,
    onStart: nextProblem,
    onReset: resetProblem,
    isAnswerCorrect: isSharingAnswerCorrect(problem, counts),
    onNextProblem: nextProblem,
  })
  const { isCorrect, isWrong, isFailurePending, isFinished } = challenge
  const locked = isCorrect || isWrong || isFailurePending || isFinished
  const remaining =
    problem.total - counts.reduce((sum, count) => sum + count, 0)
  const counterSrc = getThemeAsset(theme.id, 'mathsCounter')
  const symbolName = theme.id === 'teenie' ? 'symbols' : 'crowns'

  const moveCounter = (index: number, delta: 1 | -1) => {
    if (locked) return
    setCounts((current) => {
      const available =
        problem.total - current.reduce((sum, count) => sum + count, 0)
      if (
        (delta === 1 && available === 0) ||
        (delta === -1 && current[index] === 0)
      )
        return current
      return current.map((count, i) => (i === index ? count + delta : count))
    })
  }
  const counters = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <MathCounter
        key={index}
        src={counterSrc}
        size={24}
        delay={0}
        animationName="share-pop-in"
      />
    ))

  return (
    <MathActivityShell
      {...props}
      persistence={challenge.persistence}
      isFinished={isFinished}
      isSuccessState={challenge.isSuccessState}
      isSetup={challenge.isSetup}
      animationStyles={getActivityFeedbackAnimationStyles('share')}
      difficultyControl={
        <CrownDifficultyControl
          theme={theme}
          value={difficulty}
          options={DIFFICULTIES}
          onChange={(value) => onDifficultyChange?.(value)}
          ariaLabel="Sharing difficulty"
        />
      }
    >
      {isRunning && (
        <MathActivityPlayArea
          theme={theme}
          results={challenge.resultHistory}
          animationPrefix="share"
          isCorrect={isCorrect}
          isWrong={isWrong}
          retryCount={challenge.retryCount}
        >
          <div
            className="sharing-board"
            role="group"
            aria-label={`Share ${problem.total} ${symbolName} equally between ${problem.containers} containers`}
            style={
              {
                '--sharing-primary': theme.colors.primary,
                '--sharing-accent': theme.colors.accent,
                '--sharing-surface': theme.colors.surface,
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              } as CSSProperties
            }
          >
            <div
              className="sharing-pool"
              role="group"
              aria-label={`${remaining} ${symbolName} left to share`}
            >
              <span className="sharing-pool-count" aria-hidden="true">
                {remaining}
              </span>
              <div className="sharing-counters" aria-hidden="true">
                {counters(remaining)}
              </div>
            </div>
            <div className="sharing-direction" aria-hidden="true">
              ↓
            </div>
            <div className="sharing-containers">
              {counts.map((count, index) => (
                <div
                  key={index}
                  className="sharing-container"
                  role="group"
                  aria-label={`Container ${index + 1}: ${count} ${symbolName}`}
                  data-unequal={
                    (isWrong && count !== problem.total / problem.containers) ||
                    undefined
                  }
                >
                  <div className="sharing-bowl" aria-hidden="true">
                    <div className="sharing-counters">{counters(count)}</div>
                    {isWrong &&
                      count !== problem.total / problem.containers && (
                        <span className="sharing-unequal">≠</span>
                      )}
                  </div>
                  <NumberStepper
                    theme={theme}
                    value={count}
                    disabled={locked}
                    decrease={{
                      onClick: () => moveCounter(index, -1),
                      disabled: count === 0,
                      ariaLabel: `Return one from container ${index + 1}`,
                    }}
                    increase={{
                      onClick: () => moveCounter(index, 1),
                      disabled: remaining === 0,
                      ariaLabel: `Add one to container ${index + 1}`,
                    }}
                    style={{ width: '100%', gap: 2 }}
                    buttonStyle={{ width: 44, height: 48, flexShrink: 0 }}
                    valueStyle={{
                      fontSize: 24,
                      fontWeight: 'bold',
                      minWidth: 0,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </MathActivityPlayArea>
      )}
    </MathActivityShell>
  )
}
