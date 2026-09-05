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
  difficultyControl?: ReactNode
  children: ReactNode
}

const MathActivityShell = ({
  isEditable = true,
  isSetup,
  animationStyles,
  difficultyControl,
  children,
  ...props
}: MathActivityShellProps) => (
  <ActivityOutcomeShell {...props}>
    <style>{animationStyles}</style>
    <ActivitySetupControls
      {...props}
      isSetup={isSetup}
      min={1}
      max={9}
      previousAriaLabel="Fewer puzzles"
      nextAriaLabel="More puzzles"
      isEditable={isEditable}
      beforeProblemControl={difficultyControl}
    />
    {children}
  </ActivityOutcomeShell>
)

export default MathActivityShell
