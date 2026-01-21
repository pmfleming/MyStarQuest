import type { ReactNode } from 'react'
import { uiTokens } from '../ui/tokens'

interface PageHeaderProps {
  title: string
  right?: ReactNode
  fontFamily?: string
  marginBottom?: number
}

const PageHeader = ({
  title,
  right,
  fontFamily,
  marginBottom,
}: PageHeaderProps) => {
  return (
    <header
      className="flex items-center gap-3"
      style={{
        minHeight: `${uiTokens.topIconSize}px`,
        marginBottom: `${marginBottom ?? uiTokens.sectionGap}px`,
      }}
    >
      <h1
        className="font-bold tracking-wide"
        style={{
          fontFamily: fontFamily || 'inherit',
          textAlign: 'left',
          fontSize: `${Math.round(uiTokens.topIconSize * 0.5)}px`,
          lineHeight: `${uiTokens.topIconSize}px`,
          height: `${uiTokens.topIconSize}px`,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h1>
      <div
        className="flex items-center justify-end gap-3"
        style={{ flexShrink: 0 }}
      >
        {right}
      </div>
    </header>
  )
}

export default PageHeader
