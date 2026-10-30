import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import type { Story } from '../data/stories'
import { useStoryPresentation } from '../hooks/useStoryPresentation'
import StoryPageArtwork from './StoryPageArtwork'
import type { Theme } from '../contexts/ThemeContext'
import { getThemeAsset } from '../ui/themeAssets'
import type { StoryOpeningFrame } from '../lib/storyMotion'
import { storyPageForKey } from '../lib/storyPresentation'
import { currentStoryChapter, getStoryChapters } from '../lib/storyChapters'
import './StoryReader.css'

export default function StoryReader({
  story,
  theme,
  openingFrame,
  onClose,
}: {
  story: Story
  theme: Theme
  openingFrame?: StoryOpeningFrame | null
  onClose: () => void
}) {
  const [page, setPage] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const { dialogRef, close, isClosing } = useStoryPresentation({
    openingFrame,
    onClose,
  })
  const stageRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number; bottom: boolean } | null>(null)
  const lastPage = story.panels.length - 1
  const panel = story.panels[page]!
  const chapters = getStoryChapters(story)
  const activeChapter = currentStoryChapter(chapters, page)
  const turn = (delta: number) =>
    setPage((current) => Math.max(0, Math.min(lastPage, current + delta)))
  const progressStyle: CSSProperties & Record<'--story-progress', string> = {
    '--story-progress': `${lastPage > 0 ? (page / lastPage) * 100 : 0}%`,
  }

  // Only the adjacent pages are prefetched, keeping the rest of the book on demand.
  useEffect(() => {
    for (const index of [page - 1, page + 1]) {
      const next = story.panels[index]
      if (next) {
        const image = new Image()
        image.decoding = 'async'
        image.fetchPriority = 'low'
        image.src = next.image
      }
    }
  }, [page, story])

  const localPoint = (event: PointerEvent) => {
    const stage = stageRef.current!
    const bounds = stage.getBoundingClientRect()
    const rotated =
      getComputedStyle(stage).getPropertyValue('--story-rotated').trim() === '1'
    return rotated
      ? {
          x: event.clientY - bounds.top,
          y: bounds.right - event.clientX,
          height: stage.clientHeight,
        }
      : {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
          height: stage.clientHeight,
        }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="story-reader"
      data-story-theme={theme.id}
      data-has-chapters={chapters.length > 0}
      aria-label={`${story.title} story reader`}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => {
        if (isClosing) {
          event.preventDefault()
          return
        }
        if (
          event.target instanceof HTMLInputElement ||
          (event.target instanceof HTMLButtonElement && event.key === ' ')
        )
          return
        const destination = storyPageForKey(event.key, page, lastPage)
        if (destination !== undefined) {
          event.preventDefault()
          setPage(destination)
        }
      }}
    >
      <div
        ref={stageRef}
        className="story-stage"
        inert={isClosing}
        data-controls-open={controlsOpen}
        onPointerDown={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('button, input, .story-controls')
          )
            return
          const point = localPoint(event)
          gesture.current = { ...point, bottom: point.y > point.height - 80 }
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }}
        onPointerUp={(event) => {
          const start = gesture.current
          gesture.current = null
          if (!start) return
          const end = localPoint(event)
          const dx = end.x - start.x
          const dy = end.y - start.y
          if (start.bottom && dy < -25 && Math.abs(dy) > Math.abs(dx))
            setControlsOpen(true)
          else if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
            turn(dx < 0 ? 1 : -1)
          else if (dy > 45) setControlsOpen(false)
        }}
        onPointerCancel={() => {
          gesture.current = null
        }}
      >
        <StoryPageArtwork
          panels={story.panels}
          page={page}
          active={!isClosing}
        />
        <button
          className="story-turn story-turn-previous"
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => turn(-1)}
        >
          <img
            src={getThemeAsset(theme.id, 'storyPageIcon')}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </button>
        <button
          className="story-turn story-turn-next"
          type="button"
          aria-label="Next page"
          disabled={page === lastPage}
          onClick={() => turn(1)}
        >
          <img
            src={getThemeAsset(theme.id, 'storyPageIcon')}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </button>
        <button
          className="story-controls-handle"
          aria-label={
            controlsOpen ? 'Hide story controls' : 'Show story controls'
          }
          aria-expanded={controlsOpen}
          aria-controls="story-controls"
          onClick={() => setControlsOpen((open) => !open)}
          onPointerDown={(event) => {
            gesture.current = { ...localPoint(event), bottom: true }
          }}
        >
          <span />
        </button>
        <div id="story-controls" className="story-controls">
          {chapters.length > 0 && (
            <nav className="story-chapters" aria-label="Story chapters">
              {chapters.map((chapter) => (
                <button
                  key={chapter.panelId}
                  type="button"
                  aria-label={chapter.label}
                  title={chapter.label}
                  aria-current={
                    chapter === activeChapter ? 'location' : undefined
                  }
                  onClick={() => setPage(chapter.page)}
                >
                  <img
                    src={chapter.image}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    decoding="async"
                    fetchPriority="low"
                  />
                </button>
              ))}
            </nav>
          )}
          <button
            type="button"
            className="story-return"
            onClick={close}
            aria-label="Return to tests"
            title="Return to tests"
          >
            <img
              src={getThemeAsset(theme.id, 'storyReturnIcon')}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          </button>
          <input
            id="story-progress"
            className="story-progress"
            type="range"
            min={0}
            max={lastPage}
            value={page}
            style={progressStyle}
            aria-label="Story progress"
            aria-valuetext={`${page + 1} of ${story.panels.length}: ${panel.label}`}
            onChange={(event) => setPage(Number(event.target.value))}
          />
          <output
            htmlFor="story-progress"
            aria-live="polite"
            aria-label={`Page ${page + 1} of ${story.panels.length}`}
          >
            <img
              src={getThemeAsset(theme.id, 'storyProgressIcon')}
              alt=""
              aria-hidden="true"
            />
            <span className="story-page-count" aria-hidden="true">
              <strong>{page + 1}</strong>
              <span className="story-page-total"> / {story.panels.length}</span>
            </span>
          </output>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
