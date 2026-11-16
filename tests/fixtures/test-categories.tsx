import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import TestCategoryPicker from '../../src/components/TestCategoryPicker'
import TestCategoryPanels from '../../src/components/TestCategoryPanels'
import StoryLibrary from '../../src/components/StoryLibrary'
import { themes } from '../../src/contexts/ThemeContext'
import {
  categoryLabels,
  type TestCategory,
} from '../../src/data/testCategories'
import '../../src/index.css'

export default function Fixture() {
  const [selected, setSelected] = useState<TestCategory>('numbers')
  const theme = themes.teenie
  return (
    <main
      style={{
        maxWidth: 520,
        margin: 'auto',
        padding: 16,
        background: theme.colors.bg,
      }}
    >
      <TestCategoryPicker
        theme={theme}
        selected={selected}
        onSelect={setSelected}
      />
      <div style={{ paddingTop: 120 }}>
        <TestCategoryPanels selected={selected}>
          {(category) =>
            category === 'stories' ? (
              <StoryLibrary theme={theme} />
            ) : (
              <article
                style={{
                  minHeight: category === 'letters' ? 420 : 260,
                  padding: 24,
                  background: theme.colors.surface,
                  border: `3px solid ${theme.colors.accent}`,
                  borderRadius: 24,
                }}
              >
                <h2>{categoryLabels[category]}</h2>
                <input aria-label={`${categoryLabels[category]} answer`} />
              </article>
            )
          }
        </TestCategoryPanels>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
