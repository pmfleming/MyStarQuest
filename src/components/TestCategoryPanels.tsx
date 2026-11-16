import { useState, type ReactNode } from 'react'
import {
  TEST_CATEGORIES,
  categoryLabels,
  type TestCategory,
} from '../data/testCategories'
import WhimsicalViewTransition from './WhimsicalViewTransition'

export default function TestCategoryPanels({
  selected,
  children,
}: {
  selected: TestCategory
  children: (category: TestCategory) => ReactNode
}) {
  const [initialCategory] = useState(selected)
  const [visited, setVisited] = useState(() => new Set([selected]))
  if (!visited.has(selected)) setVisited(new Set([...visited, selected]))

  return (
    <div className="isolate grid min-w-0">
      {TEST_CATEGORIES.filter((category) => visited.has(category)).map(
        (category) => (
          <WhimsicalViewTransition
            key={category}
            open={category === selected}
            animateOnMount={category !== initialCategory}
            overlap
          >
            <section
              id={`test-category-${category}`}
              aria-label={categoryLabels[category]}
            >
              {children(category)}
            </section>
          </WhimsicalViewTransition>
        )
      )}
    </div>
  )
}
