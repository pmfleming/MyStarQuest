import { useCallback, useRef, useState, type CSSProperties } from 'react'
import {
  pickSharingFriends,
  pickSharingTreat,
  type SharingFriend,
  type SharingTreat,
} from '../data/sharingFriends'
import type { SharingDifficulty } from '../data/types'
import { useCheckedActivityChallenge } from '../hooks/useActivityChallenge'
import {
  generateSharingProblem,
  isSharingAnswerCorrect,
  sharingProblemKey,
  type SharingProblem,
} from '../lib/sharingProblems'
import type { ActivityChoreProps } from './ui/ActivityControls'
import CrownDifficultyControl from './ui/CrownDifficultyControl'
import MathActivityPlayArea from './ui/MathActivityPlayArea'
import MathActivityShell from './ui/MathActivityShell'
import { NumberStepper } from './ui/StepperButton'
import { getActivityFeedbackAnimationStyles } from './ui/activityAnimationStyles'
import SharingToken from './sharing/SharingToken'
import './SharingTester.css'

type FriendMood = 'waiting' | 'happy' | 'sad'

export interface SharingTesterProps extends ActivityChoreProps {
  difficulty?: SharingDifficulty
  onDifficultyChange?: (difficulty: SharingDifficulty) => void | Promise<void>
}

const EMPTY_PROBLEM: SharingProblem = { total: 0, containers: 0 }
const DIFFICULTIES = [
  { value: 'easy' as const, label: 'Easy', crowns: 1 },
  { value: 'hard' as const, label: 'Hard', crowns: 2 },
  { value: 'mixed' as const, label: 'Mixed: 2, 3 or 4 friends', crowns: 3 },
]

export default function SharingTester(props: SharingTesterProps) {
  const { theme, isRunning, difficulty = 'easy', onDifficultyChange } = props
  const [problem, setProblem] = useState(EMPTY_PROBLEM)
  const [counts, setCounts] = useState<number[]>([])
  const [treat, setTreat] = useState<SharingTreat>(() =>
    pickSharingTreat(theme.id)
  )
  const [friends, setFriends] = useState<SharingFriend[]>([])
  const seen = useRef(new Set<string>())
  const nextProblem = useCallback(() => {
    setTreat((previous) => pickSharingTreat(theme.id, previous.id))
    const next = generateSharingProblem(difficulty, seen.current)
    // Keep insertion order in recency order when the small question pool cycles.
    seen.current.delete(sharingProblemKey(next))
    seen.current.add(sharingProblemKey(next))
    setFriends((previous) =>
      pickSharingFriends(theme.id, next.containers, previous)
    )
    setProblem(next)
    setCounts(Array(next.containers).fill(0))
  }, [difficulty, theme.id])
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
  const symbolName = treat.plural
  const fairShare = problem.containers ? problem.total / problem.containers : 0
  const most = Math.max(0, ...counts)
  const allEqual = counts.every((count) => count === most)
  const moodFor = (count: number): FriendMood => {
    if (isCorrect) return 'happy'
    if (isWrong) return count < fairShare ? 'sad' : 'waiting'
    if (count < most) return 'sad'
    return remaining === 0 && problem.total > 0 && allEqual
      ? 'happy'
      : 'waiting'
  }
  const speechFor = (count: number) => {
    if (!isWrong || count === fairShare) return undefined
    if (count > fairShare) return 'Too many!'
    return allEqual ? 'More, please!' : 'Not fair!'
  }

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
  const counters = (count: number, bowl?: number) =>
    Array.from({ length: count }, (_, index) => (
      <SharingToken
        key={index}
        treat={treat}
        drop={bowl === undefined ? undefined : { index, count, bowl }}
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
          resultBarStyle={{ height: 36 }}
        >
          <div
            className="sharing-board"
            data-theme={theme.id}
            data-friends={problem.containers}
            role="group"
            aria-label={`Share ${problem.total} ${symbolName} equally between ${problem.containers} friends`}
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
              <div className="sharing-counters" aria-hidden="true">
                {counters(remaining)}
              </div>
            </div>
            <div className="sharing-containers">
              {counts.map((count, index) => {
                const friend = friends[index]!
                const mood = moodFor(count)
                const speech = speechFor(count)
                return (
                  <div
                    key={index}
                    className="sharing-container"
                    role="group"
                    aria-label={`${friend.name}: ${count} ${count === 1 ? treat.singular : treat.plural}${mood === 'sad' ? ', feeling sad' : ''}`}
                    data-mood={mood}
                    data-unequal={(isWrong && count !== fairShare) || undefined}
                  >
                    <div className="sharing-holder">
                      <FriendPortrait
                        friend={friend}
                        mood={mood}
                        speech={speech}
                      />
                      <div
                        className="sharing-bowl"
                        aria-hidden="true"
                        data-density={
                          count > 12 ? 'packed' : count > 6 ? 'full' : undefined
                        }
                      >
                        <div className="sharing-counters">
                          {counters(count, index)}
                        </div>
                        <span className="sharing-bowl-crest">
                          <svg viewBox="0 0 32 24" focusable="false">
                            {theme.id === 'teenie' ? (
                              <path d="M16 22C-8 7 6-4 16 6 26-4 40 7 16 22Z" />
                            ) : (
                              <path d="m3 5 7 6 6-10 6 10 7-6-3 17H6Z" />
                            )}
                          </svg>
                        </span>
                      </div>
                    </div>
                    <NumberStepper
                      theme={theme}
                      value={count}
                      disabled={locked}
                      decrease={{
                        onClick: () => moveCounter(index, -1),
                        disabled: count === 0,
                        ariaLabel: `Take one back from ${friend.name}`,
                      }}
                      increase={{
                        onClick: () => moveCounter(index, 1),
                        disabled: remaining === 0,
                        ariaLabel: `Give one to ${friend.name}`,
                      }}
                      style={{ width: '100%', gap: 2 }}
                      buttonStyle={{ width: 44, height: 44, flexShrink: 0 }}
                      valueStyle={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        minWidth: 0,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </MathActivityPlayArea>
      )}
    </MathActivityShell>
  )
}

function FriendPortrait({
  friend,
  mood,
  speech,
}: {
  friend: SharingFriend
  mood: FriendMood
  speech?: string
}) {
  return (
    <div className="sharing-friend">
      <div className="sharing-friend-stage">
        {speech && (
          <span className="sharing-speech" aria-live="polite">
            {speech}
          </span>
        )}
        <img
          className="sharing-friend-art"
          src={friend.src}
          alt=""
          draggable={false}
        />
        {mood === 'sad' && (
          <span className="sharing-teardrops" aria-hidden="true">
            <i />
            <i />
          </span>
        )}
        {mood === 'happy' && (
          <span className="sharing-sparkles" aria-hidden="true">
            <i>✨</i>
            <i>✨</i>
          </span>
        )}
      </div>
    </div>
  )
}
