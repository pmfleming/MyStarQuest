import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import TabContent from '../../src/components/TabContent'
import PageHeader from '../../src/components/PageHeader'
import TestCategoryPicker from '../../src/components/TestCategoryPicker'
import { themes } from '../../src/contexts/ThemeContext'
import type { TestCategory } from '../../src/data/testCategories'
import { uiTokens } from '../../src/tokens'
import '../../src/index.css'

export default function Fixture() {
  const [category, setCategory] = useState<TestCategory>('numbers')
  const custom = new URLSearchParams(location.search).has('custom')
  return (
    <div style={{ height: '100dvh', background: themes.teenie.colors.bg }}>
      <TabContent
        theme={themes.teenie}
        headerHeight={
          custom ? uiTokens.pageControlHeight : uiTokens.floatingNavHeight
        }
        header={
          custom ? (
            <header>
              <TestCategoryPicker
                theme={themes.teenie}
                selected={category}
                onSelect={setCategory}
              />
            </header>
          ) : (
            <PageHeader theme={themes.teenie} title="Chores" />
          )
        }
      >
        {Array.from({ length: 30 }, (_, index) => (
          <div key={index} style={{ height: 100, padding: 20 }}>
            Activity {index + 1}
          </div>
        ))}
      </TabContent>
      <nav
        aria-label="Bottom navigation"
        style={{ position: 'absolute', bottom: 12, left: 20 }}
      >
        <button>Home</button>
      </nav>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
