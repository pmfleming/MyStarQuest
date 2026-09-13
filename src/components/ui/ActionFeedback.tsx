export type ActionFeedbackState = {
  actionError: string | null
  retryAction: () => void
}

export const ActionFeedback = ({
  actionError,
  retryAction,
}: ActionFeedbackState) =>
  actionError ? (
    <div role="alert">
      {actionError}{' '}
      <button type="button" onClick={retryAction}>
        Retry
      </button>
    </div>
  ) : null
