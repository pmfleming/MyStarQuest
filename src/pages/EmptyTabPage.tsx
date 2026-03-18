import { useTheme } from '../contexts/ThemeContext'
import PageShell from '../components/PageShell'
import type { AppTabId } from '../lib/tabNavigation'

type EmptyTabPageProps = {
  activeTabId: AppTabId
}

const EmptyTabPage = ({ activeTabId }: EmptyTabPageProps) => {
  const { theme } = useTheme()

  return <PageShell theme={theme} activeTabId={activeTabId} />
}

export default EmptyTabPage
