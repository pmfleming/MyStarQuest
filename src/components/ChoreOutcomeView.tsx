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
  const {
    outcomeContainerMinHeight,
    outcomeContainerRadius,
    outcomeContainerPadding,
    quizOutcomeImageMaxWidth,
    quizOutcomeImageMaxHeight,
  } = uiTokens.activityTokens

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: `${outcomeContainerMinHeight}px`,
        padding: `${outcomeContainerPadding}px`,
        borderRadius: `${outcomeContainerRadius}px`,
        boxSizing: 'border-box',
      }}
    >
      <img
        src={
          imageSrc ??
          (outcome === 'success' ? quizCorrectIcon : quizIncorrectIcon)
        }
        alt={outcome === 'success' ? successAlt : failureAlt}
        style={{
          width: '100%',
          maxWidth: `${quizOutcomeImageMaxWidth}px`,
          maxHeight: `${quizOutcomeImageMaxHeight}px`,
          objectFit: 'contain',
        }}
      />
    </div>
  )
}

export default ChoreOutcomeView
