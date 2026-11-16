import { useLayoutEffect, useRef } from 'react'

export default function AgendaTitle({ title }: { title: string }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return
    let disposed = false
    let frame: number | undefined
    let previousWidth = -1
    let previousFont = ''
    let natural = 0
    const fit = () => {
      frame = undefined
      if (disposed) return
      const style = getComputedStyle(container)
      const available =
        container.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      const font = [style.font, style.letterSpacing, style.textTransform].join(
        '|'
      )
      if (available === previousWidth && font === previousFont) return
      if (font !== previousFont || !natural) {
        text.style.fontSize = ''
        natural = text.getBoundingClientRect().width
      }
      previousWidth = available
      previousFont = font
      const size =
        available > 0 && natural > available
          ? `${(parseFloat(style.fontSize) * available) / natural}px`
          : ''
      if (text.style.fontSize !== size) text.style.fontSize = size
    }
    const schedule = () => {
      if (!disposed && frame === undefined) frame = requestAnimationFrame(fit)
    }
    fit()
    const observer = new ResizeObserver(schedule)
    observer.observe(container)
    const card = container.closest('li')
    if (card) observer.observe(card)
    const fontsChanged = () => {
      previousFont = ''
      schedule()
    }
    void document.fonts?.ready.then(fontsChanged)
    document.fonts?.addEventListener('loadingdone', fontsChanged)
    return () => {
      disposed = true
      observer.disconnect()
      if (frame !== undefined) cancelAnimationFrame(frame)
      document.fonts?.removeEventListener('loadingdone', fontsChanged)
    }
  }, [title])

  return (
    <span ref={containerRef} className="day-agenda__title">
      <span ref={textRef}>{title}</span>
    </span>
  )
}
