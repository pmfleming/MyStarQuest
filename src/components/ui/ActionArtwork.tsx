import type { CSSProperties, ReactNode } from 'react'
import { uiTokens } from '../../tokens'
import './actionArtwork.css'

export const ActionArtwork = ({ children }: { children: ReactNode }) => (
  <span
    className="action-artwork"
    aria-hidden="true"
    style={
      {
        '--action-artwork-size': `${uiTokens.listActionArtworkScale * 100}%`,
      } as CSSProperties
    }
  >
    {children}
  </span>
)
