import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Story } from '../data/stories'
import { enterStoryPresentation } from '../lib/storyPresentation'
import './StoryReader.css'

export default function StoryReader({
  story,
  onClose,
}: {
  story: Story
  onClose: () => void
}) {
  const [page, setPage] = useState(0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number; bottom: boolean } | null>(null)
  const lastPage = story.panels.length - 1
  const panel = story.panels[page]!
  const turn = (delta: number) =>
    setPage((current) => Math.max(0, Math.min(lastPage, current + delta)))

  useEffect(() => {
    const dialog = dialogRef.current!
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let disposed = false
    // Fullscreen enters the top layer too. Open the dialog afterwards so it
    // remains above the app when the fullscreen transition completes.
    const presentation = Promise.resolve()
      // React's development replay disposes its first effect immediately.
      // Start once that replay finishes, avoiding competing fullscreen requests.
      .then(() => (disposed ? null : enterStoryPresentation()))
      .then((exit) => {
        if (exit && !disposed) dialog.showModal()
        return exit
      })
    let removeBackListener: (() => void) | undefined
    void import('@capacitor/core').then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform() || disposed) return
      const { App } = await import('@capacitor/app')
      if (disposed) return
      const listener = await App.addListener('backButton', onClose)
      if (disposed) void listener.remove()
      else
        removeBackListener = () => {
          void listener.remove()
        }
    })
    return () => {
      disposed = true
      removeBackListener?.()
      dialog.close()
      document.body.style.overflow = previousOverflow
      void presentation.then((exit) => exit?.())
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [onClose])

  // Only the adjacent pages are prefetched, keeping the rest of the book on demand.
  useEffect(() => {
    for (const index of [page - 1, page + 1]) {
      const next = story.panels[index]
      if (next) new Image().src = next.image
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
      aria-label={`${story.title} story reader`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (
          event.target instanceof HTMLInputElement ||
          (event.target instanceof HTMLButtonElement && event.key === ' ')
        )
          return
        const delta = ['ArrowRight', 'PageDown', ' '].includes(event.key)
          ? 1
          : ['ArrowLeft', 'PageUp'].includes(event.key)
            ? -1
            : 0
        if (delta) {
          event.preventDefault()
          turn(delta)
        }
        if (event.key === 'Home') {
          event.preventDefault()
          setPage(0)
        }
        if (event.key === 'End') {
          event.preventDefault()
          setPage(lastPage)
        }
      }}
    >
      <div
        ref={stageRef}
        className="story-stage"
        data-controls-open={controlsOpen}
        onPointerDown={(event) => {
          if (
            (event.target as Element).closest('button, input, .story-controls')
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
        <div className="story-artwork">
          <img
            key={panel.image}
            src={panel.image}
            alt={panel.alt}
            draggable={false}
            onError={() => setFailedImage(panel.image)}
            onLoad={() =>
              setFailedImage((failed) =>
                failed === panel.image ? null : failed
              )
            }
          />
          {failedImage === panel.image && (
            <p className="story-image-error" role="alert">
              This page could not load. Check your connection, or try another
              page.
            </p>
          )}
        </div>
        <button
          className="story-turn story-turn-previous"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => turn(-1)}
        >
          ‹
        </button>
        <button
          className="story-turn story-turn-next"
          aria-label="Next page"
          disabled={page === lastPage}
          onClick={() => turn(1)}
        >
          ›
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
          <button type="button" onClick={onClose}>
            ← Return to tests
          </button>
          <input
            type="range"
            min={0}
            max={lastPage}
            value={page}
            aria-label="Story progress"
            aria-valuetext={`${page + 1} of ${story.panels.length}: ${panel.label}`}
            onChange={(event) => setPage(Number(event.target.value))}
          />
          <output aria-live="polite">
            {page + 1} / {story.panels.length}
          </output>
        </div>
      </div>
    </dialog>,
    document.body
  )
}
