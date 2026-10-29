import { lazy, Suspense, useCallback, useState } from 'react'
import { stories, type Story } from '../data/stories'
import type { Theme } from '../contexts/ThemeContext'
import './StoryLibrary.css'

const StoryReader = lazy(() => import('./StoryReader'))

export default function StoryLibrary({ theme }: { theme: Theme }) {
  const [selected, setSelected] = useState<Story | null>(null)
  const closeStory = useCallback(() => setSelected(null), [])

  return (
    <>
      <div className="story-library">
        {stories.map((story) => (
          <article className="story-card" key={story.id}>
            <img
              src={story.panels[0]?.image}
              alt={`${story.title} story cover`}
            />
            <button
              type="button"
              style={{ background: theme.colors.primary }}
              onClick={(event) => {
                // Safari does not focus buttons on pointer activation by default.
                // Establish the return target before the modal takes focus.
                event.currentTarget.focus()
                setSelected(story)
              }}
              aria-label={`Read ${story.title}`}
            >
              Read story <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
      {selected && (
        <Suspense fallback={<p role="status">Opening story…</p>}>
          <StoryReader
            key={selected.id}
            story={selected}
            onClose={closeStory}
          />
        </Suspense>
      )}
    </>
  )
}
