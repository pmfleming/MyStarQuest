import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { stories, type Story } from '../data/stories'
import type { Theme } from '../contexts/ThemeContext'
import StandardActionList from './ui/StandardActionList'
import { ActionImage } from './ui/ActionArtwork'
import { uiTokens } from '../tokens'
import teenieReading from '../assets/themes/teenie/category-reading.webp'
import princessReading from '../assets/themes/princess/category-reading.webp'
import {
  captureStoryOpeningFrame,
  type StoryOpeningFrame,
} from '../lib/storyMotion'

const StoryReader = lazy(() => import('./StoryReader'))

export default function StoryLibrary({ theme }: { theme: Theme }) {
  const [selected, setSelected] = useState<Story | null>(null)
  const [openingFrame, setOpeningFrame] = useState<StoryOpeningFrame | null>(
    null
  )
  const libraryRef = useRef<HTMLDivElement>(null)
  const closeStory = useCallback(() => setSelected(null), [])

  return (
    <>
      <div
        ref={libraryRef}
        onClickCapture={(event) => {
          // Establish the return target in Safari before the modal takes focus.
          if (event.target instanceof Element)
            event.target.closest('button')?.focus()
        }}
      >
        <StandardActionList
          theme={theme}
          items={stories}
          getKey={(story) => story.id}
          getItemLabel={(story) => story.title}
          renderItem={(story) => (
            <div style={{ height: uiTokens.cardOutcomeBodyHeight }}>
              <img
                src={story.panels[0]?.image}
                alt={`${story.title} story cover`}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
            </div>
          )}
          getPrimaryAction={(story) => ({
            label: 'Read story',
            ariaLabel: `Read ${story.title}`,
            icon: (
              <ActionImage
                src={theme.id === 'teenie' ? teenieReading : princessReading}
              />
            ),
            onClick: (story) => {
              setOpeningFrame(captureStoryOpeningFrame(libraryRef.current))
              setSelected(story)
            },
          })}
          getUtilityAction={() => undefined}
          hideEdit
          hideAdd
          onDelete={() => {}}
          addLabel="Add story"
          onAdd={() => {}}
        />
      </div>
      {selected && (
        <Suspense fallback={<p role="status">Opening story…</p>}>
          <StoryReader
            key={selected.id}
            story={selected}
            theme={theme}
            openingFrame={openingFrame}
            onClose={closeStory}
          />
        </Suspense>
      )}
    </>
  )
}
