import type { ReactNode } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'
import DragScrollRegion from './ui/DragScrollRegion'
import PageHeader from './PageHeader'
import AppMenu from './AppMenu'

interface TabContentProps {
  theme: Theme
  title?: string
  onResetToday?: () => Promise<void>
  children?: ReactNode
}

const TabContent = ({
  theme,
  title,
  onResetToday,
  children,
}: TabContentProps) => (
  <div className="relative flex h-full flex-col overflow-hidden">
    {title && (
      <PageHeader
        theme={theme}
        title={title}
        right={<AppMenu theme={theme} onResetToday={onResetToday} />}
        fontFamily={theme.fonts.heading}
      />
    )}
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{
        paddingLeft: '0px',
        paddingRight: '0px',
        paddingTop: '0px',
        paddingBottom: `${uiTokens.pagePaddingBottom}px`,
      }}
    >
      <DragScrollRegion
        theme={theme}
        className="min-h-0 flex-1"
        topNavPadding={!!title}
        bottomNavPadding
      >
        {children}
      </DragScrollRegion>
    </div>
  </div>
)

export default TabContent
