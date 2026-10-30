import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { Story } from '../data/stories'
import { STORY_PAGE_TRANSITION_MS } from '../lib/storyMotion'
import { createPhotoMoment } from '../lib/storyPhotoMoment'
import {
  getStorySceneFactory,
  type StorySceneFactory,
} from '../lib/storyScenes'
import { createStorySparkles } from '../lib/storySparkles'
import { createMorningRooms } from '../lib/storyMorningRooms'
import {
  createStoryTransitions,
  storyPageLayoutBounds,
} from '../lib/storyTransitions'
import '../lib/storyPaper.css'

type LayeredScene = ReturnType<StorySceneFactory>
type PageStyle = CSSProperties & { '--story-page-ratio': string }
const pageStyle = (aspectRatio: number): PageStyle => ({
  '--story-page-ratio': String(aspectRatio),
})

export default function StoryPageArtwork({
  panels,
  page,
  active = true,
}: {
  panels: Story['panels']
  page: number
  active?: boolean
}) {
  const [frame, setFrame] = useState({
    page,
    previous: null as number | null,
    fromPage: null as number | null,
    direction: 'next',
  })
  const [failedPage, setFailedPage] = useState<number | null>(null)
  const surface = useRef<HTMLDivElement>(null)
  const previousSurface = useRef<HTMLDivElement>(null)
  const transitionHost = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const from = frame.fromPage === null ? null : panels[frame.fromPage]!
    const to = panels[frame.page]!
    const host = transitionHost.current
    const current = surface.current
    const previous = previousSurface.current
    const dialog = host?.closest('dialog')
    if (
      !active ||
      !from ||
      !host ||
      !current ||
      !current.animate ||
      !previous ||
      dialog?.dataset.storyOpening === 'true'
    )
      return
    const player = createStoryTransitions(host, current, {
      localCoordinates: true,
      previous,
    })
    if (player.canPlay(from, to)) {
      void player.play(from, to, storyPageLayoutBounds(previous))
    }
    return () => player.dispose()
  }, [frame.fromPage, frame.page, panels, active])
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
                  fromPage: current.page,
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
  const previous = frame.previous === null ? null : panels[frame.previous]!
  const continuousUnderwater =
    panel.effect === 'underwater-meeting' &&
    previous?.effect === 'underwater-meeting'
  const createScene = getStorySceneFactory(panel.effect)
  const sceneVisible =
    active &&
    (panel.effect === 'underwater-meeting'
      ? panels[page]?.effect === 'underwater-meeting'
      : frame.page === page)
  const style: CSSProperties &
    Record<'--story-page-duration' | '--story-page-ratio', string> = {
    '--story-page-duration': `${STORY_PAGE_TRANSITION_MS}ms`,
    ...pageStyle(panel.aspectRatio),
  }
  return (
    <div
      className="story-artwork"
      style={style}
      data-direction={frame.direction}
      aria-busy={frame.page !== page && failedPage !== page}
    >
      {previous && !continuousUnderwater && (
        <div
          key={`previous-${frame.previous}`}
          ref={previousSurface}
          className="story-page-sheet story-paper story-page-previous"
          style={pageStyle(previous.aspectRatio)}
          aria-hidden="true"
        >
          <div className="story-paper-illustration">
            <img src={previous.image} alt="" draggable={false} />
          </div>
        </div>
      )}
      <div
        ref={surface}
        key={panel.effect === 'underwater-meeting' ? 'underwater' : panel.id}
        className="story-page-surface story-page-sheet story-paper"
        data-motion={panel.motion ?? 'still'}
        data-framing={panel.framing}
        data-morphing={frame.previous !== null}
      >
        <div className="story-paper-illustration">
          <img
            key={frame.page}
            className="story-page-current"
            src={panel.image}
            alt={panel.alt}
            draggable={false}
          />
          {active && panel.effect === 'photo-moment' && frame.page === page && (
            <StoryPhotoMoment key={panel.id} />
          )}
          {sceneVisible && createScene && (
            <StoryLayeredScene panelId={panel.id} create={createScene} />
          )}
          {active &&
            panel.effect === 'morning-rooms' &&
            frame.page === page && <StoryMorningRooms />}
          {active && <StorySparkles panelId={panel.id} />}
        </div>
      </div>
      <div
        ref={transitionHost}
        className="story-transition-host"
        aria-hidden="true"
      />
      {failedPage === page && (
        <p className="story-image-error" role="alert">
          This page could not load. Check your connection, or try another page.
        </p>
      )}
    </div>
  )
}

function StoryPhotoMoment() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const moment = createPhotoMoment(host.current!)
    void moment.play()
    return () => moment.dispose()
  }, [])
  return <div className="story-photo-moment" ref={host} aria-hidden="true" />
}

function StoryLayeredScene({
  panelId,
  create,
}: {
  panelId: string
  create: StorySceneFactory
}) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<LayeredScene | null>(null)
  useEffect(() => {
    if (!host.current) return
    const instance = create(host.current)
    scene.current = instance
    return () => {
      instance.dispose()
      scene.current = null
    }
  }, [create])
  useEffect(() => {
    void scene.current?.show(panelId)
  }, [panelId, create])
  return <div className="story-effect-host" ref={host} aria-hidden="true" />
}

function StoryMorningRooms() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const rooms = createMorningRooms(host.current!)
    return () => rooms.dispose()
  }, [])
  return (
    <div className="story-effect-host active" ref={host} aria-hidden="true" />
  )
}

function StorySparkles({ panelId }: { panelId: string }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const sparkles = createStorySparkles(host.current!)
    sparkles.show(panelId)
    return () => sparkles.dispose()
  }, [panelId])
  return <div className="story-effect-host" ref={host} aria-hidden="true" />
}
