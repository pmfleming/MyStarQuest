import type { Theme } from '../../contexts/ThemeContext'
import type { TaskRecord, TaskUpdatableFields } from '../../data/types'
import { getSeasonForDate } from '../../lib/today'
import {
  princessNonSchoolDayAutumnImage,
  princessNonSchoolDaySpringImage,
  princessNonSchoolDaySummerImage,
  princessNonSchoolDayWinterImage,
  princessSchoolDayImage,
} from '../../assets/themes/princess/assets'
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

const getPrincessNonSchoolDayImage = () => {
  switch (getSeasonForDate(new Date())) {
    case 'spring':
      return princessNonSchoolDaySpringImage
    case 'summer':
      return princessNonSchoolDaySummerImage
    case 'autumn':
      return princessNonSchoolDayAutumnImage
    case 'winter':
    default:
      return princessNonSchoolDayWinterImage
  }
}

const ScheduleDayTypeControl = ({
  theme,
  task,
  onUpdate,
}: ScheduleDayTypeControlProps) => {
  const nonSchoolDayImage = getPrincessNonSchoolDayImage()

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
        icon={princessSchoolDayImage}
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
