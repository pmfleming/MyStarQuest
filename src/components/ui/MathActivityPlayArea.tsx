import type { ComponentProps } from 'react'
import { getThemeAsset } from '../../ui/themeAssets'
import { ActivityPlayArea } from './ActivityControls'

type Props = Pick<
  ComponentProps<typeof ActivityPlayArea>,
  'theme' | 'results' | 'children'
> & {
  animationPrefix: string
  isCorrect: boolean
  isWrong: boolean
  retryCount: number
}

export default function MathActivityPlayArea({
  theme,
  animationPrefix,
  isCorrect,
  isWrong,
  retryCount,
  ...props
}: Props) {
  const animation = isWrong
    ? `${animationPrefix}-shake 0.5s ease`
    : isCorrect
      ? `${animationPrefix}-pop-in 0.4s ease`
      : undefined

  return (
    <ActivityPlayArea
      {...props}
      theme={theme}
      correctIcon={getThemeAsset(theme.id, 'quizCorrectImage')}
      incorrectIcon={getThemeAsset(theme.id, 'quizIncorrectImage')}
      slideAnimationName={`${animationPrefix}-slide-in-right`}
      animation={animation}
      shakeKey={isWrong ? `shake-${retryCount}` : undefined}
    />
  )
}
