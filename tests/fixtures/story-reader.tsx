import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { themes } from '../../src/contexts/ThemeContext'
import TestCategoryPicker from '../../src/components/TestCategoryPicker'
import StoryLibrary from '../../src/components/StoryLibrary'
import type { TestCategory } from '../../src/data/testCategories'
import '../../src/index.css'

export default function Fixture() {
  const [category, setCategory] = useState<TestCategory>('stories')
  const theme =
    new URLSearchParams(location.search).get('theme') === 'teenie'
      ? themes.teenie
      : themes.princess
  return (
    <main
      style={{
        maxWidth: 520,
        margin: 'auto',
        padding: 16,
        background: theme.colors.bg,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <TestCategoryPicker
        theme={theme}
        selected={category}
        onSelect={setCategory}
      />
      <section id="test-category-stories" hidden={category !== 'stories'}>
        <StoryLibrary theme={theme} />
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>
)
