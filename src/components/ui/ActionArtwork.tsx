import type { CSSProperties, ReactNode } from 'react'
import { uiTokens } from '../../tokens'
import './actionArtwork.css'

export const ActionArtwork = ({
  children,
  scale = uiTokens.listActionArtworkScale,
}: {
  children: ReactNode
  scale?: number
}) => (
  <span
    className="action-artwork"
    aria-hidden="true"
    style={
      {
        '--action-artwork-size': `${scale * 100}%`,
      } as CSSProperties
    }
  >
    {children}
  </span>
)
