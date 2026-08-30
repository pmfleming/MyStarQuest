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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: `${uiTokens.cardSuccessImageHeight}px`,
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
          width: '100%',
          maxWidth: `${quizOutcomeImageMaxWidth}px`,
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  )
}

export default ChoreOutcomeView
