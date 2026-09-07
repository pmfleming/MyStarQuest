import { getThemeAsset } from '../../ui/themeAssets'
import { getNonSchoolDayImages } from '../../ui/seasonAssets'
import type { Theme } from '../../contexts/ThemeContext'
import type { TaskRecord, TaskUpdatableFields } from '../../data/types'
import { getSeasonForDate } from '../../lib/today'
import { uiTokens } from '../../tokens'
import { IconChoiceButton } from './IconActionControls'

type SchedulableTask = Pick<
  TaskRecord,
  'id' | 'schoolDayEnabled' | 'nonSchoolDayEnabled'
>

type ScheduleDayTypeControlProps = {
  theme: Theme
  task: SchedulableTask
  onUpdate: (taskId: string, field: TaskUpdatableFields) => void
}

const ScheduleDayTypeControl = ({
  theme,
  task,
  onUpdate,
}: ScheduleDayTypeControlProps) => {
  const nonSchoolDayImage = getNonSchoolDayImages(theme.id)[
    getSeasonForDate(new Date())
  ]

  return (
    <div
      className="grid grid-cols-2"
      style={{
        rowGap: `${uiTokens.controlRowGap}px`,
        columnGap: `${uiTokens.controlColumnGap}px`,
      }}
    >
      <IconChoiceButton
        theme={theme}
        icon={getThemeAsset(theme.id, 'schoolDayImage')}
        ariaLabel="Schoolday"
        onClick={() =>
          onUpdate(task.id, { schoolDayEnabled: !task.schoolDayEnabled })
        }
        selected={task.schoolDayEnabled}
      />
      <IconChoiceButton
        theme={theme}
        icon={nonSchoolDayImage}
        ariaLabel="Non-school day"
        onClick={() =>
          onUpdate(task.id, {
            nonSchoolDayEnabled: !task.nonSchoolDayEnabled,
          })
        }
        selected={task.nonSchoolDayEnabled}
      />
    </div>
  )
}

export default ScheduleDayTypeControl
