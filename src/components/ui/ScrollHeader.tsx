import type { CSSProperties, ReactNode, Ref } from 'react'
import './ScrollHeader.css'

export default function ScrollHeader({
  children,
  progress,
  height,
  ref,
}: {
  children: ReactNode
  progress: number
  height: number
  ref: Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className="scroll-header"
      data-hidden={progress === 1}
      inert={progress === 1}
      style={
        {
          height: height + 24,
          '--scroll-header-progress': progress,
        } as CSSProperties
      }
    >
      {children}
    </div>
  )
}
