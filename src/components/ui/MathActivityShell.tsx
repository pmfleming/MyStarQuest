import type { ReactNode } from 'react'
import type { ActivityChoreProps } from './ActivityControls'
import { ActivityOutcomeShell, ActivitySetupControls } from './ActivityControls'

type MathActivityShellProps = Pick<
  ActivityChoreProps,
  | 'theme'
  | 'totalProblems'
  | 'starReward'
  | 'isEditable'
  | 'onAdjustProblems'
  | 'onStarsChange'
  | 'completionImage'
  | 'failureImage'
> & {
  isSetup: boolean
  isFinished: boolean
  isSuccessState: boolean
  animationStyles: string
  difficultyControl: ReactNode
  children: ReactNode
}

const MathActivityShell = ({
  theme,
  totalProblems,
  starReward,
  isEditable,
  onAdjustProblems,
  onStarsChange,
  completionImage,
  failureImage,
  isSetup,
  isFinished,
  isSuccessState,
  animationStyles,
  difficultyControl,
  children,
}: MathActivityShellProps) => (
  <ActivityOutcomeShell
    isFinished={isFinished}
    isSuccessState={isSuccessState}
    completionImage={completionImage}
    failureImage={failureImage}
  >
    <style>{animationStyles}</style>
    <ActivitySetupControls
      isSetup={isSetup}
      theme={theme}
      totalProblems={totalProblems}
      min={1}
      max={10}
      onAdjustProblems={onAdjustProblems}
      starReward={starReward}
      onStarsChange={onStarsChange}
      previousAriaLabel="Fewer puzzles"
      nextAriaLabel="More puzzles"
      isEditable={isEditable}
      beforeProblemControl={difficultyControl}
    />
    {children}
  </ActivityOutcomeShell>
)

export default MathActivityShell
