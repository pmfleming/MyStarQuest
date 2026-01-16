import type { ReactNode } from 'react'
import { uiTokens } from '../ui/tokens'

interface PageHeaderProps {
  title: string
  left?: ReactNode
  right?: ReactNode
  fontFamily?: string
}

const PageHeader = ({ title, left, right, fontFamily }: PageHeaderProps) => {
  return (
    <header
      className="flex items-center justify-between"
      style={{
        minHeight: `${uiTokens.topIconSize}px`,
        marginBottom: `${uiTokens.sectionGap}px`,
      }}
    >
      <div className="flex items-center gap-3">{left}</div>
      <h1
        className="text-3xl font-bold tracking-wide"
        style={{ fontFamily: fontFamily || 'inherit', textAlign: 'center' }}
      >
        {title}
      </h1>
      <div
        className="flex items-center justify-end"
        style={{ minWidth: `${uiTokens.topIconSize}px` }}
      >
        {right}
      </div>
    </header>
  )
}

export default PageHeader
