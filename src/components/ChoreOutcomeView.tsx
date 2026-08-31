import quizCorrectIcon from '../assets/themes/princess/quiz-correct.svg'
import quizIncorrectIcon from '../assets/themes/princess/quiz-incorrect.svg'
import { uiTokens } from '../tokens'

type ChoreOutcomeViewProps = {
  imageSrc?: string
  outcome: 'success' | 'failure'
  successAlt?: string
  failureAlt?: string
}

const ChoreOutcomeView = ({
  imageSrc,
  outcome,
  successAlt = 'All done!',
  failureAlt = 'Try again!',
}: ChoreOutcomeViewProps) => {
  const { outcomeContainerRadius, quizOutcomeImageMaxWidth } =
    uiTokens.activityTokens
  const announcement = outcome === 'success' ? successAlt : failureAlt
  const fillsCard = outcome === 'success'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: `${uiTokens.cardOutcomeBodyHeight}px`,
        borderRadius: `${outcomeContainerRadius}px`,
        boxSizing: 'border-box',
      }}
      role="status"
      aria-live="polite"
      aria-label={announcement}
    >
      <img
        src={
          imageSrc ??
          (outcome === 'success' ? quizCorrectIcon : quizIncorrectIcon)
        }
        alt=""
        aria-hidden="true"
        style={{
          position: fillsCard ? 'absolute' : undefined,
          inset: fillsCard ? 0 : undefined,
          width: '100%',
          height: fillsCard ? '100%' : undefined,
          maxWidth: fillsCard ? 'none' : `${quizOutcomeImageMaxWidth}px`,
          maxHeight: fillsCard ? 'none' : '100%',
          objectFit: fillsCard ? 'cover' : 'contain',
          objectPosition: 'center',
          display: 'block',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
    </div>
  )
}

export default ChoreOutcomeView
