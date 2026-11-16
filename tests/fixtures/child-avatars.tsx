import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { createChildDefinitionListRowDescriptor } from '../../src/ui/definitionRowDescriptors'
import { themeOptions } from '../../src/ui/themeOptions'
import type { ChildProfile } from '../../src/data/types'
import '../../src/index.css'

export default function ChildAvatarsFixture() {
  const [child, setChild] = useState<ChildProfile>({
    id: 'odette',
    displayName: 'Odette',
    avatarToken: 'odette-ping',
    themeId: 'teenie',
    totalStars: 103,
    testFailureModeEnabled: false,
  })
  const themeId = child.themeId || 'princess'
  const theme = themes[themeId]
  const descriptor = createChildDefinitionListRowDescriptor({
    theme,
    activeChildId: child.id,
    themeOptions,
    nameDrafts: {},
    setNameDraft: () => {},
    commitDisplayName: () => {},
    updateChildField: (_, patch) =>
      setChild((value) => ({ ...value, ...patch })),
    changeTheme: (_, themeId) => setChild((value) => ({ ...value, themeId })),
    selectChild: () => {},
  })
  return (
    <ThemeContext.Provider
      value={{ theme, currentTheme: themeId, setTheme: () => {} }}
    >
      <main
        style={{
          maxWidth: 560,
          margin: 'auto',
          padding: 12,
          background: theme.colors.bg,
        }}
      >
        <StandardActionList
          theme={theme}
          items={[child]}
          getKey={(item) => item.id}
          getItemLabel={(item) => item.displayName}
          {...descriptor}
          hideEdit
        />
      </main>
    </ThemeContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(<ChildAvatarsFixture />)
