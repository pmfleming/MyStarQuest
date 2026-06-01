import type { Theme } from '../contexts/ThemeContext'
import TopIconButton from '../components/ui/TopIconButton'
import { uiTokens } from '../tokens'
import type { TaskWithEphemeral } from '../data/types'
import {
  princessChildrenIcon,
  princessExitIcon,
  princessResetIcon,
} from '../assets/themes/princess/assets'
import {
  IconActionButton,
  IconChoiceButton,
} from '../components/ui/IconActionControls'
import { getPrincessTaskTypeIcon } from '../ui/taskTypeIcons'

const getThemeAssets = (themeId: string) => {
  if (themeId === 'princess') {
    return {
      switchProfileIcon: princessChildrenIcon,
      exitIcon: princessExitIcon,
    }
  }

  return {
    switchProfileIcon: null,
    exitIcon: null,
  }
}

type DashboardHeaderActionsProps = {
  theme: Theme
  activeChildId: string | null
  isResettingToday: boolean
  onResetToday: () => void
  onLogout: () => void
}

export const DashboardHeaderActions = ({
  theme,
  activeChildId,
  isResettingToday,
  onResetToday,
  onLogout,
}: DashboardHeaderActionsProps) => {
  const themeAssets = getThemeAssets(theme.id)

  return (
    <>
      <TopIconButton
        theme={theme}
        onClick={onResetToday}
        disabled={!activeChildId || isResettingToday}
        ariaLabel="Reset today"
        icon={
          theme.id === 'princess' ? (
            <img
              src={princessResetIcon}
              alt="Reset today"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-2xl" role="img" aria-hidden="true">
              R
            </span>
          )
        }
      />
      <TopIconButton
        theme={theme}
        to="/settings/manage-children"
        ariaLabel="Children"
        icon={
          themeAssets.switchProfileIcon ? (
            <img
              src={themeAssets.switchProfileIcon}
              alt="Children"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-2xl">U</span>
          )
        }
      />
      <TopIconButton
        theme={theme}
        onClick={onLogout}
        ariaLabel="Exit"
        icon={
          themeAssets.exitIcon ? (
            <img
              src={themeAssets.exitIcon}
              alt="Exit"
              className="h-10 w-10 object-contain"
            />
          ) : (
            <span className="text-2xl">X</span>
          )
        }
      />
    </>
  )
}

type DashboardChoreChooserProps = {
  theme: Theme
  tasks: TaskWithEphemeral[]
  availableChores: TaskWithEphemeral[]
  onAddTodo: (task: TaskWithEphemeral) => void
  onClose: () => void
}

export const DashboardChoreChooser = ({
  theme,
  tasks,
  availableChores,
  onAddTodo,
  onClose,
}: DashboardChoreChooserProps) => (
  <div
    className="grid grid-cols-3"
    style={{
      rowGap: `${uiTokens.controlRowGap}px`,
      columnGap: `${uiTokens.controlColumnGap}px`,
    }}
  >
    {availableChores.length === 0 ? (
      <div className="col-span-3">
        <UnavailableChoreMessage theme={theme} hasTasks={tasks.length > 0} />
      </div>
    ) : (
      availableChores.map((task) => (
        <IconChoiceButton
          key={task.id}
          theme={theme}
          icon={getPrincessTaskTypeIcon(task.taskType)}
          ariaLabel={task.title}
          onClick={() => {
            onAddTodo(task)
            onClose()
          }}
        />
      ))
    )}
    <div className="col-span-3 flex justify-center">
      <IconActionButton
        theme={theme}
        icon={princessExitIcon}
        ariaLabel="Cancel"
        onClick={onClose}
      />
    </div>
  </div>
)

const UnavailableChoreMessage = ({
  theme,
  hasTasks,
}: {
  theme: Theme
  hasTasks: boolean
}) => (
  <>
    <div
      className="text-center"
      style={{
        color: theme.colors.text,
        fontFamily: theme.fonts.heading,
        fontWeight: 800,
        fontSize: '1.05rem',
      }}
    >
      {hasTasks
        ? 'All available chores are already added today.'
        : 'No chores have been created yet.'}
    </div>
  </>
)
