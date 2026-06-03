import { useMemo, useState, type CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import ActionTextInput from '../components/ui/ActionTextInput'
import {
  IconActionButton,
  IconActionRow,
  IconChoiceButton,
  StandardIconImage,
} from '../components/ui/IconActionControls'
import ScheduleDayTypeControl from '../components/ui/ScheduleDayTypeControl'
import NumberStepperControl from '../components/ui/NumberStepperControl'
import StarDisplay from '../components/ui/StarDisplay'
import { uiTokens } from '../tokens'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_WATER_TOILET_STARS,
  type ChoreType,
} from '../data/types'
import type { ChoreDocumentSettings } from '../data/taskDocuments'
import {
  princessBiteIcon,
  princessClockIcon,
  princessExitIcon,
  princessGiveStarIcon,
} from '../assets/themes/princess/assets'
import { getPrincessTaskTypeIcon } from '../ui/taskTypeIcons'

type ChoreDraft = {
  title: string
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  dinnerDurationMinutes: number
  dinnerTotalBites: number
}

type ChoreTypeOption = {
  type: ChoreType
  label: string
  icon: string
  defaultDraft: ChoreDraft
}

type ChoreCreationFlowProps = {
  theme: Theme
  isSaving: boolean
  onSave: (
    choreType: ChoreType,
    settings: ChoreDocumentSettings
  ) => void | Promise<void>
  onCancel: () => void
}

const typeOptions: ChoreTypeOption[] = [
  {
    type: 'standard',
    label: 'Standard Chore',
    icon: getPrincessTaskTypeIcon('standard'),
    defaultDraft: {
      title: 'New Chore',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: 1,
      dinnerDurationMinutes: DEFAULT_DINNER_DURATION_SECONDS / 60,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    },
  },
  {
    type: 'eating',
    label: 'Dinner',
    icon: getPrincessTaskTypeIcon('eating'),
    defaultDraft: {
      title: 'Dinner',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      starValue: DEFAULT_DINNER_STARS,
      dinnerDurationMinutes: DEFAULT_DINNER_DURATION_SECONDS / 60,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    },
  },
  {
    type: 'watertoiletcheck',
    label: 'Water & Toilet Check',
    icon: getPrincessTaskTypeIcon('watertoiletcheck'),
    defaultDraft: {
      title: 'Water & Toilet Check',
      schoolDayEnabled: true,
      nonSchoolDayEnabled: false,
      starValue: DEFAULT_WATER_TOILET_STARS,
      dinnerDurationMinutes: DEFAULT_DINNER_DURATION_SECONDS / 60,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    },
  },
]

const getOption = (type: ChoreType) =>
  typeOptions.find((option) => option.type === type) ?? typeOptions[0]

const ChoreCreationFlow = ({
  theme,
  isSaving,
  onSave,
  onCancel,
}: ChoreCreationFlowProps) => {
  const [selectedType, setSelectedType] = useState<ChoreType | null>(null)
  const [draft, setDraft] = useState<ChoreDraft>(typeOptions[0].defaultDraft)

  const selectedOption = useMemo(
    () => (selectedType ? getOption(selectedType) : null),
    [selectedType]
  )

  const updateDraft = (patch: Partial<ChoreDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const selectType = (type: ChoreType) => {
    const option = getOption(type)
    setSelectedType(type)
    setDraft(option.defaultDraft)
  }

  const save = () => {
    if (!selectedType || isSaving) return

    const trimmedTitle = draft.title.trim()
    if (trimmedTitle.length === 0) return

    const settings: ChoreDocumentSettings = {
      title: trimmedTitle,
      schoolDayEnabled: draft.schoolDayEnabled,
      nonSchoolDayEnabled: draft.nonSchoolDayEnabled,
      starValue: draft.starValue,
      isRepeating: true,
    }

    if (selectedType === 'eating') {
      settings.dinnerDurationSeconds = draft.dinnerDurationMinutes * 60
      settings.dinnerTotalBites = draft.dinnerTotalBites
    }

    onSave(selectedType, settings)
  }

  const panelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${uiTokens.panelStackGap}px`,
  }

  const selectedIconFrameStyle: CSSProperties = {
    width: '72px',
    height: '72px',
    borderRadius: `${uiTokens.listActionRadius - 4}px`,
    background: `${theme.colors.surface}cc`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const draftScheduleTask = {
    id: 'new-chore',
    schoolDayEnabled: draft.schoolDayEnabled,
    nonSchoolDayEnabled: draft.nonSchoolDayEnabled,
  }

  if (!selectedOption) {
    return (
      <div style={panelStyle}>
        <div
          className="grid grid-cols-3"
          style={{
            rowGap: `${uiTokens.controlRowGap}px`,
            columnGap: `${uiTokens.controlColumnGap}px`,
          }}
        >
          {typeOptions.map((option) => (
            <IconChoiceButton
              key={option.type}
              theme={theme}
              icon={option.icon}
              ariaLabel={option.label}
              onClick={() => selectType(option.type)}
              disabled={isSaving}
            />
          ))}
        </div>
        <IconActionButton
          theme={theme}
          icon={princessExitIcon}
          ariaLabel="Cancel"
          onClick={onCancel}
          style={{ margin: '0 auto' }}
        />
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div
        className="flex items-center"
        style={{ justifyContent: 'center', color: theme.colors.text }}
      >
        <span style={selectedIconFrameStyle}>
          <StandardIconImage
            src={selectedOption.icon}
            fit="cover"
            width="100%"
            height="100%"
          />
        </span>
      </div>

      <ActionTextInput
        theme={theme}
        label="Name"
        value={draft.title}
        onChange={(title) => updateDraft({ title })}
        maxLength={80}
        baseColor={theme.colors.primary}
        inputAriaLabel="Chore name"
        transparent
      />

      <div
        className="flex flex-col"
        style={{ gap: `${uiTokens.controlRowGap}px` }}
      >
        <ScheduleDayTypeControl
          theme={theme}
          task={draftScheduleTask}
          onUpdate={(_, field) => {
            const patch: Partial<ChoreDraft> = {}

            if (typeof field.schoolDayEnabled === 'boolean') {
              patch.schoolDayEnabled = field.schoolDayEnabled
            }

            if (typeof field.nonSchoolDayEnabled === 'boolean') {
              patch.nonSchoolDayEnabled = field.nonSchoolDayEnabled
            }

            updateDraft(patch)
          }}
        />
      </div>

      <div
        className="flex flex-col"
        style={{ gap: `${uiTokens.controlRowGap}px` }}
      >
        <StarDisplay
          theme={theme}
          count={draft.starValue}
          editable
          min={0}
          max={10}
          onChange={(starValue) => updateDraft({ starValue })}
        />
      </div>

      {selectedType === 'eating' && (
        <div
          className="grid grid-cols-2"
          style={{
            rowGap: `${uiTokens.controlRowGap}px`,
            columnGap: `${uiTokens.controlColumnGap}px`,
          }}
        >
          <NumberStepperControl
            theme={theme}
            label="Minutes"
            icon={princessClockIcon}
            value={draft.dinnerDurationMinutes}
            min={1}
            max={60}
            step={1}
            onChange={(dinnerDurationMinutes) =>
              updateDraft({ dinnerDurationMinutes })
            }
          />
          <NumberStepperControl
            theme={theme}
            label="Bites"
            icon={princessBiteIcon}
            value={draft.dinnerTotalBites}
            min={1}
            max={20}
            step={1}
            onChange={(dinnerTotalBites) => updateDraft({ dinnerTotalBites })}
          />
        </div>
      )}

      <IconActionRow
        theme={theme}
        primaryIcon={princessGiveStarIcon}
        primaryAriaLabel="Save"
        onPrimaryClick={save}
        primaryDisabled={isSaving || draft.title.trim().length === 0}
        primaryIconOpacity={isSaving ? 0.55 : 1}
        utilityIcon={princessExitIcon}
        utilityAriaLabel="Back"
        onUtilityClick={() => setSelectedType(null)}
        utilityDisabled={isSaving}
      />
    </div>
  )
}

export default ChoreCreationFlow
