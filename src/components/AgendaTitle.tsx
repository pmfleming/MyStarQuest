import { useLayoutEffect, useRef } from 'react'

export default function AgendaTitle({ title }: { title: string }) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return
    let disposed = false
    const fit = () => {
      if (disposed) return
      text.style.fontSize = ''
      const style = getComputedStyle(container)
      const available =
        container.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      const natural = text.getBoundingClientRect().width
      if (available > 0 && natural > available) {
        const fontSize = parseFloat(style.fontSize)
        text.style.fontSize = `${(fontSize * available) / natural}px`
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(container)
    const card = container.closest('li')
    if (card) observer.observe(card)
    void document.fonts?.ready.then(fit)
    return () => {
      disposed = true
      observer.disconnect()
    }
  }, [title])

  return (
    <span ref={containerRef} className="day-agenda__title">
      <span ref={textRef}>{title}</span>
    </span>
  )
}
