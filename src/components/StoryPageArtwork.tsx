import { useEffect, useState, type CSSProperties } from 'react'
import type { Story } from '../data/stories'
import { STORY_PAGE_TRANSITION_MS } from '../lib/storyMotion'

export default function StoryPageArtwork({
  panels,
  page,
}: {
  panels: Story['panels']
  page: number
}) {
  const [frame, setFrame] = useState({
    page,
    previous: null as number | null,
    direction: 'next',
  })
  const [failedPage, setFailedPage] = useState<number | null>(null)
  useEffect(() => {
    let disposed = false
    const image = new Image()
    image.decoding = 'async'
    image.fetchPriority = 'high'
    image.onload = () => {
      // Keep the old page visible until the new artwork can actually be painted.
      void image
        .decode()
        .catch(() => {})
        .then(() => {
          if (disposed) return
          setFailedPage(null)
          setFrame((current) =>
            current.page === page
              ? current
              : {
                  page,
                  previous: current.page,
                  direction: page > current.page ? 'next' : 'previous',
                }
          )
        })
    }
    image.onerror = () => {
      if (!disposed) setFailedPage(page)
    }
    image.src = panels[page]!.image
    return () => {
      disposed = true
      image.onload = null
      image.onerror = null
    }
  }, [page, panels])

  useEffect(() => {
    if (frame.previous === null) return
    // Also release the outgoing image when reduced motion disables animation events.
    const timer = setTimeout(() => {
      setFrame((current) =>
        current === frame ? { ...current, previous: null } : current
      )
    }, STORY_PAGE_TRANSITION_MS)
    return () => clearTimeout(timer)
  }, [frame])

  const panel = panels[frame.page]!
  const style: CSSProperties &
    Record<'--story-page-duration' | '--story-page-ratio', string> = {
    '--story-page-duration': `${STORY_PAGE_TRANSITION_MS}ms`,
    '--story-page-ratio': String(panel.aspectRatio),
  }
  return (
    <div
      className="story-artwork"
      style={style}
      data-direction={frame.direction}
      aria-busy={frame.page !== page && failedPage !== page}
    >
      <div
        className="story-page-surface"
        data-morphing={frame.previous !== null}
      >
        {frame.previous !== null && (
          <img
            key={`previous-${frame.previous}`}
            className="story-page-previous"
            src={panels[frame.previous]!.image}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        )}
        <img
          key={frame.page}
          className={[
            'story-page-current',
            frame.previous !== null && 'story-page-entering',
          ]
            .filter(Boolean)
            .join(' ')}
          src={panel.image}
          alt={panel.alt}
          draggable={false}
        />
      </div>
      {failedPage === page && (
        <p className="story-image-error" role="alert">
          This page could not load. Check your connection, or try another page.
        </p>
      )}
    </div>
  )
}
