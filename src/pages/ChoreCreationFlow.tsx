import { useMemo, useState, type CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import ActionTextInput from '../components/ui/ActionTextInput'
import Carousel from '../components/ui/Carousel'
import { IconActionRow } from '../components/ui/IconActionControls'
import ScheduleDayTypeControl from '../components/ui/ScheduleDayTypeControl'
import StarDisplay from '../components/ui/StarDisplay'
import { InlineChoiceList } from '../components/ui/InlineChoiceList'
import { uiTokens } from '../tokens'
import { choreImageOptions } from '../assets/chores/assets'
import {
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_DINNER_STARS,
  DEFAULT_WATER_TOILET_STARS,
  type ChoreType,
  type ChoreWithEphemeral,
} from '../data/types'
import type { ChoreDocumentSettings } from '../data/taskDocuments'
import {
  princessExitIcon,
  princessGiveStarIcon,
  princessPlateImage,
} from '../assets/themes/princess/assets'
import { getPrincessTaskTypeIcon } from '../ui/taskTypeIcons'
import { renderDinnerChore } from '../ui/presetChoreRenderers'

type ChoreDraft = {
  title: string
  schoolDayEnabled: boolean
  nonSchoolDayEnabled: boolean
  starValue: number
  imageKey: string
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
  initialChore?: ChoreWithEphemeral
}

const DRAFT_DINNER_MIN_MINUTES = 5
const DRAFT_DINNER_MAX_MINUTES = 30
const DRAFT_DINNER_MIN_BITES = 1
const DRAFT_DINNER_MAX_BITES = 16

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

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
      imageKey: '',
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
      imageKey: '',
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
      imageKey: '',
      dinnerDurationMinutes: DEFAULT_DINNER_DURATION_SECONDS / 60,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    },
  },
]

const getOption = (type: ChoreType) =>
  typeOptions.find((option) => option.type === type) ?? typeOptions[0]

const getDraftForChore = (chore: ChoreWithEphemeral): ChoreDraft => ({
  title: chore.title,
  schoolDayEnabled: chore.schoolDayEnabled,
  nonSchoolDayEnabled: chore.nonSchoolDayEnabled,
  starValue: chore.starValue,
  imageKey: chore.imageKey ?? '',
  dinnerDurationMinutes:
    chore.taskType === 'eating'
      ? chore.dinnerDurationSeconds / 60
      : DEFAULT_DINNER_DURATION_SECONDS / 60,
  dinnerTotalBites:
    chore.taskType === 'eating' ? chore.dinnerTotalBites : DEFAULT_DINNER_BITES,
})

const ChoreCreationFlow = ({
  theme,
  isSaving,
  onSave,
  onCancel,
  initialChore,
}: ChoreCreationFlowProps) => {
  const isEditing = Boolean(initialChore)
  const [selectedType, setSelectedType] = useState<ChoreType | null>(
    initialChore?.taskType ?? null
  )
  const [draft, setDraft] = useState<ChoreDraft>(
    initialChore ? getDraftForChore(initialChore) : typeOptions[0].defaultDraft
  )

  const carouselItems = useMemo(
    () =>
      choreImageOptions.map((option) => ({
        id: option.id,
        label: option.label,
        icon: option.image ? (
          <img
            src={option.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
            aria-hidden="true"
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 14,
              border: `3px dashed ${theme.colors.primary}`,
              display: 'block',
              opacity: 0.55,
            }}
          />
        ),
      })),
    [theme.colors.primary]
  )

  const currentImageIndex = Math.max(
    0,
    choreImageOptions.findIndex((option) => option.id === draft.imageKey)
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
      isRepeating: initialChore?.isRepeating ?? true,
    }

    if (selectedType === 'standard') {
      settings.imageKey = draft.imageKey
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

  const draftScheduleTask = {
    id: 'new-chore',
    schoolDayEnabled: draft.schoolDayEnabled,
    nonSchoolDayEnabled: draft.nonSchoolDayEnabled,
  }
  const draftDinnerDurationSeconds = draft.dinnerDurationMinutes * 60

  if (!selectedType) {
    return (
      <div style={panelStyle}>
        <InlineChoiceList
          theme={theme}
          choices={typeOptions.map((option) => ({
            key: option.type,
            label: option.label,
            icon: option.icon,
            disabled: isSaving,
            onSelect: () => selectType(option.type),
          }))}
          onCancel={onCancel}
        />
      </div>
    )
  }

  return (
    <div style={panelStyle}>
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

      {selectedType === 'standard' && (
        <Carousel
          key={draft.imageKey}
          items={carouselItems}
          title="Chore image"
          initialIndex={currentImageIndex}
          onChange={(index) => {
            const selected = choreImageOptions[index]
            if (!selected || selected.id === draft.imageKey) return
            updateDraft({ imageKey: selected.id })
          }}
        />
      )}

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
        <>
          {renderDinnerChore({
            theme,
            duration: draftDinnerDurationSeconds,
            remaining: draftDinnerDurationSeconds,
            totalBites: draft.dinnerTotalBites,
            bitesLeft: draft.dinnerTotalBites,
            starReward: draft.starValue,
            isTimerRunning: false,
            plateImage: princessPlateImage,
            onAdjustTime: (delta) =>
              updateDraft({
                dinnerDurationMinutes: clamp(
                  draft.dinnerDurationMinutes + delta / 60,
                  DRAFT_DINNER_MIN_MINUTES,
                  DRAFT_DINNER_MAX_MINUTES
                ),
              }),
            onAdjustBites: (delta) =>
              updateDraft({
                dinnerTotalBites: clamp(
                  draft.dinnerTotalBites + delta,
                  DRAFT_DINNER_MIN_BITES,
                  DRAFT_DINNER_MAX_BITES
                ),
              }),
            onStarsChange: (starValue) => updateDraft({ starValue }),
            showStarReward: false,
          })}
        </>
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
        onUtilityClick={() => {
          if (isEditing) {
            onCancel()
            return
          }
          setSelectedType(null)
        }}
        utilityDisabled={isSaving}
      />
    </div>
  )
}

export default ChoreCreationFlow
