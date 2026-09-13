type PendingAction = 'primary' | 'edit' | 'utility' | null

export function getActionButtonState({
  hidePrimary,
  hideEdit,
  hasEdit,
  hideUtility,
  confirmingReset,
  pendingAction,
  primaryDisabled,
  utilityDisabled,
}: {
  hidePrimary: boolean
  hideEdit: boolean
  hasEdit: boolean
  hideUtility: boolean
  confirmingReset: boolean
  pendingAction: PendingAction
  primaryDisabled: boolean
  utilityDisabled: boolean
}) {
  const pending = pendingAction !== null
  const showPrimary = !hidePrimary
  const showEdit = !hideEdit && hasEdit
  const showUtility = !hideUtility
  const confirm = showUtility && confirmingReset
  return {
    showPrimary,
    showEdit,
    showUtility,
    confirm,
    utilityColumns: Number(showEdit) + (showUtility ? 1 : 0) + Number(confirm),
    primaryDisabled: primaryDisabled || pending || confirmingReset,
    editDisabled: pending || confirmingReset,
    utilityDisabled: utilityDisabled || pending,
    cancelDisabled: pending,
  }
}
