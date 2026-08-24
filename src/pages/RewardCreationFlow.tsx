import { useState, type CSSProperties } from 'react'
import type { Theme } from '../contexts/ThemeContext'
import ActionTextInput from '../components/ui/ActionTextInput'
import ImageOptionCarousel from '../components/ui/ImageOptionCarousel'
import RepeatControl from '../components/ui/RepeatControl'
import StarDisplay from '../components/ui/StarDisplay'
import { IconActionRow } from '../components/ui/IconActionControls'
import { rewardImageOptions } from '../assets/rewards/assets'
import {
  princessExitIcon,
  princessSaveIcon,
} from '../assets/themes/princess/assets'
import { uiTokens } from '../tokens'
import type { RewardDocumentSettings } from '../data/useRewards'

type RewardDraft = {
  title: string
  imageKey: string
  costStars: number
  isRepeating: boolean
}

type RewardCreationFlowProps = {
  theme: Theme
  isSaving: boolean
  onSave: (settings: RewardDocumentSettings) => void | Promise<void>
  onCancel: () => void
}

const defaultDraft: RewardDraft = {
  title: 'New Reward',
  imageKey: '',
  costStars: 5,
  isRepeating: true,
}

const RewardCreationFlow = ({
  theme,
  isSaving,
  onSave,
  onCancel,
}: RewardCreationFlowProps) => {
  const [draft, setDraft] = useState<RewardDraft>(defaultDraft)

  const updateDraft = (patch: Partial<RewardDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const save = () => {
    if (isSaving) return

    const trimmedTitle = draft.title.trim()
    if (trimmedTitle.length === 0) return

    onSave({
      title: trimmedTitle,
      costStars: draft.costStars,
      isRepeating: draft.isRepeating,
      imageKey: draft.imageKey,
    })
  }

  const panelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: `${uiTokens.panelStackGap}px`,
  }

  return (
    <div style={panelStyle}>
      <ActionTextInput
        theme={theme}
        label="Reward"
        value={draft.title}
        onChange={(title) => updateDraft({ title })}
        maxLength={80}
        baseColor={theme.colors.secondary}
        inputAriaLabel="Reward name"
        transparent
      />

      <ImageOptionCarousel
        theme={theme}
        options={rewardImageOptions}
        title="Reward image"
        selectedId={draft.imageKey}
        onChange={(imageKey) => updateDraft({ imageKey })}
      />

      <StarDisplay
        theme={theme}
        count={draft.costStars}
        editable
        min={0}
        max={999}
        onChange={(costStars) => updateDraft({ costStars })}
      />

      <RepeatControl
        theme={theme}
        value={draft.isRepeating}
        onChange={(isRepeating) => updateDraft({ isRepeating })}
        label="Keep available after buying"
        showLabel={false}
        showFeedback={false}
      />

      <IconActionRow
        theme={theme}
        primaryIcon={princessSaveIcon}
        primaryAriaLabel="Save reward"
        onPrimaryClick={save}
        primaryDisabled={isSaving || draft.title.trim().length === 0}
        primaryIconOpacity={isSaving ? 0.55 : 1}
        utilityIcon={princessExitIcon}
        utilityAriaLabel="Discard reward"
        onUtilityClick={onCancel}
        utilityDisabled={isSaving}
      />
    </div>
  )
}

export default RewardCreationFlow
