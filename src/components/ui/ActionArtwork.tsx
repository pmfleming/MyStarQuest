import type { CSSProperties, ReactNode } from 'react'
import { uiTokens } from '../../tokens'
import './actionArtwork.css'

export const ActionArtwork = ({
  children,
  scale = uiTokens.listActionArtworkScale,
}: {
  children: ReactNode
  scale?: number
}) => {
  const style: CSSProperties & Record<'--action-artwork-size', string> = {
    '--action-artwork-size': `${scale * 100}%`,
  }
  return (
    <span className="action-artwork" aria-hidden="true" style={style}>
      {children}
    </span>
  )
}
