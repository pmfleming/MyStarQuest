import type {
  ChildScope,
  InvitationEntry,
  ParentEntry,
  SharedOperation,
  SharedReceipt,
} from '../../functions/src/sharing/protocol'

export async function sharingCall<Result>(
  name: string,
  data: unknown
): Promise<Result> {
  const [{ getFunctions, httpsCallable }, { app }] = await Promise.all([
    import('firebase/functions'),
    import('../firebase'),
  ])
  try {
    const result = await httpsCallable<unknown, Result>(
      getFunctions(app),
      name
    )(data)
    return result.data
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : ''
    if (code === 'functions/internal' || code === 'functions/unavailable')
      throw Object.assign(
        new Error(
          'Parent sharing is temporarily unavailable. Please try again later.'
        ),
        { code }
      )
    throw error
  }
}
export const sendChildOperation = (
  scope: ChildScope,
  operation: SharedOperation
) => sharingCall<SharedReceipt>('applyChildOperation', { scope, operation })
export type ParentsResult = {
  parents: ParentEntry[]
  invitations: InvitationEntry[]
}
