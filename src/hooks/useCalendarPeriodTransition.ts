import { useLayoutEffect, useRef } from 'react'

// Crossfade inside the calendar without resizing the frame or moving controls below it.
export function useCalendarPeriodTransition(period: string) {
  const frameRef = useRef<HTMLDivElement>(null)
  const pending = useRef<HTMLElement | null>(null)
  const running = useRef<(() => void) | null>(null)

  function prepareTransition() {
    const frame = frameRef.current
    const grid = frame?.querySelector<HTMLElement>(':scope > :not([hidden])')
    running.current?.()
    pending.current = null
    if (
      !frame ||
      !grid ||
      frame.getBoundingClientRect().height === 0 ||
      typeof frame.animate !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const image = grid.cloneNode(true)
    if (!(image instanceof HTMLElement)) return
    image.setAttribute('aria-hidden', 'true')
    image.setAttribute('inert', '')
    image.classList.add('calendar-transition-previous')
    pending.current = image
  }

  useLayoutEffect(() => {
    const frame = frameRef.current
    const grid = frame?.querySelector<HTMLElement>(':scope > :not([hidden])')
    const previous = pending.current
    pending.current = null
    if (!frame || !grid || !previous) return

    // Animate the visible stage, including the illustrated day view.
    frame.dataset.transitioning = 'true'
    frame.append(previous)
    const easing = 'cubic-bezier(0.22, 1, 0.36, 1)'
    const animations = [
      grid.animate(
        [
          { opacity: 0, transform: 'translateY(14px) scale(0.97)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        { duration: 360, easing }
      ),
      previous.animate(
        [
          { opacity: 1, transform: 'translateY(0) scale(1)' },
          { opacity: 0, transform: 'translateY(-8px) scale(1.02)' },
        ],
        {
          duration: 200,
          easing: 'ease-out',
          fill: 'forwards',
        }
      ),
    ]
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      animations.forEach((animation) => animation.cancel())
      previous.remove()
      delete frame.dataset.transitioning
      motionPreference.removeEventListener('change', finish)
      if (running.current === finish) running.current = null
    }
    running.current = finish
    motionPreference.addEventListener('change', finish)
    void Promise.all(animations.map((animation) => animation.finished)).then(
      finish,
      () => {} // Cancellation is expected on a rapid switch or unmount.
    )
    return finish
  }, [period])

  return { frameRef, prepareTransition }
}
