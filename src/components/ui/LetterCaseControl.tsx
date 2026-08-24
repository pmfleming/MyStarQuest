import type { Theme } from '../../contexts/ThemeContext'
import SegmentedChoiceControl from './SegmentedChoiceControl'

export type LetterCase = 'upper' | 'lower'

type LetterCaseControlProps = {
  theme: Theme
  value: LetterCase
  onChange: (value: LetterCase) => void
}

const LetterCaseControl = ({
  theme,
  value,
  onChange,
}: LetterCaseControlProps) => (
  <SegmentedChoiceControl
    theme={theme}
    value={value}
    options={[
      { value: 'upper', label: 'ABC' },
      { value: 'lower', label: 'abc' },
    ]}
    onChange={onChange}
    ariaLabel="Letter case"
  />
)

export default LetterCaseControl
