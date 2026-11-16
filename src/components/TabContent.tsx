import { useContext, type ReactNode } from 'react'
import { ActivityTabVisibleContext } from '../contexts/ActivityTabContext'
import type { Theme } from '../contexts/ThemeContext'
import { uiTokens } from '../tokens'
import DragScrollRegion from './ui/DragScrollRegion'
import PageHeader from './PageHeader'
import AppMenu from './AppMenu'
import ScrollHeader from './ui/ScrollHeader'
import { useScrollHeader } from '../hooks/useScrollHeader'

interface TabContentProps {
  theme: Theme
  title?: string
  header?: ReactNode
  headerHeight?: number
  onResetToday?: () => Promise<void>
  children?: ReactNode
}

const TabContent = ({
  theme,
  title,
  header,
  headerHeight = uiTokens.floatingNavHeight,
  onResetToday,
  children,
}: TabContentProps) => {
  const isVisible = useContext(ActivityTabVisibleContext)
  const { headerRef, progress, onScroll } = useScrollHeader(
    headerHeight,
    isVisible
  )
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {(header || title) && (
        <ScrollHeader ref={headerRef} progress={progress} height={headerHeight}>
          {header ??
            (title && (
              <PageHeader
                theme={theme}
                title={title}
                right={
                  <AppMenu
                    key={String(isVisible)}
                    theme={theme}
                    onResetToday={onResetToday}
                  />
                }
                fontFamily={theme.fonts.heading}
              />
            ))}
        </ScrollHeader>
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
          className="min-h-0 flex-1"
          topNavPadding={!!title}
          onScroll={onScroll}
          contentStyle={
            header ? { paddingTop: `${headerHeight + 24}px` } : undefined
          }
          bottomNavPadding
        >
          {children}
        </DragScrollRegion>
      </div>
    </div>
  )
}

export default TabContent
