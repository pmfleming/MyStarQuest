import { useState } from 'react'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { useMealPeriod } from '../../src/hooks/useMealPeriod'
import { getMealChoreTitle } from '../../src/lib/mealTime'
import { getMealImage } from '../../src/ui/choreOverviewAssets'
import { createUnifiedChoreDescriptor } from '../../src/ui/unifiedChoreDescriptors'
import type { ChoreWithEphemeral } from '../../src/data/types'

const chore: ChoreWithEphemeral = {
  id: 'meal',
  title: 'Dinner',
  childId: 'child',
  category: 'eating',
  taskType: 'eating',
  starValue: 3,
  isRepeating: true,
  schoolDayEnabled: true,
  nonSchoolDayEnabled: true,
  dinnerDurationSeconds: 1800,
  dinnerTotalBites: 5,
}

export default function MealChoreFixture({
  themeId = 'teenie',
  timeZone = 'Europe/London',
}: {
  themeId?: 'teenie' | 'princess'
  timeZone?: string
}) {
  const theme = themes[themeId]
  const mealPeriod = useMealPeriod(timeZone)
  const [active, setActive] = useState(false)
  const descriptor = createUnifiedChoreDescriptor({
    theme,
    mealPeriod,
    activeMealIcon: getMealImage(themeId, mealPeriod),
    activeIds: new Set(active ? [chore.id] : []),
    checkTriggers: {},
    biteCooldownSeconds: 0,
    onStartDinner: () => setActive(true),
  })
  return (
    <ThemeContext.Provider
      value={{ theme, currentTheme: themeId, setTheme: () => {} }}
    >
      <main
        style={{
          maxWidth: 560,
          padding: 20,
          margin: 'auto',
          background: theme.colors.bg,
        }}
      >
        <StandardActionList
          theme={theme}
          items={[chore]}
          getKey={(item) => item.id}
          getItemLabel={(item) => getMealChoreTitle(item, mealPeriod)}
          {...descriptor}
        />
      </main>
    </ThemeContext.Provider>
  )
}
