import type { Theme } from '../contexts/ThemeContext'
import {
  TEST_CATEGORIES,
  categoryLabels,
  type TestCategory,
} from '../data/testCategories'
import { getThemeAsset } from '../ui/themeAssets'
import teenieThinking from '../assets/themes/teenie/category-thinking.webp'
import teenieReading from '../assets/themes/teenie/category-reading.webp'
import teenieArithmetic from '../assets/themes/teenie/category-arithmetic.webp'
import teenieWriting from '../assets/teenie/memo.webp'
import princessThinking from '../assets/themes/princess/category-thinking.webp'
import princessReading from '../assets/themes/princess/category-reading.webp'
import SegmentedChoiceControl from './ui/SegmentedChoiceControl'

export default function TestCategoryPicker({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme
  selected: TestCategory
  onSelect: (category: TestCategory) => void
}) {
  const images: Record<TestCategory, string> = {
    numbers:
      theme.id === 'teenie'
        ? teenieArithmetic
        : getThemeAsset(theme.id, 'mathsIcon'),
    letters:
      theme.id === 'teenie'
        ? teenieWriting
        : getThemeAsset(theme.id, 'writing'),
    trivia: theme.id === 'teenie' ? teenieThinking : princessThinking,
    stories: theme.id === 'teenie' ? teenieReading : princessReading,
  }

  return (
    <SegmentedChoiceControl
      theme={theme}
      value={selected}
      onChange={onSelect}
      ariaLabel="Test categories"
      size="page"
      options={TEST_CATEGORIES.map((category) => ({
        value: category,
        label: categoryLabels[category],
        icon: images[category],
      }))}
    />
  )
}
