import type { ChildScope } from '../../functions/src/sharing/protocol'
export type { ChildScope } from '../../functions/src/sharing/protocol'
const prefix = 'child-scope:'
export function childStorageKey(scope: ChildScope) {
  return (
    prefix +
    JSON.stringify([
      scope.actorUid,
      scope.ownerUid,
      scope.childId,
      scope.membershipVersion,
    ])
  )
}
export function parseChildScope(key: string | undefined): ChildScope | null {
  if (!key?.startsWith(prefix)) return null
  try {
    const [actorUid, ownerUid, childId, membershipVersion] = JSON.parse(
      key.slice(prefix.length)
    ) as unknown[]
    if (
      ![actorUid, ownerUid, childId].every(
        (value) =>
          typeof value === 'string' && value.length > 0 && !value.includes('/')
      ) ||
      !Number.isSafeInteger(membershipVersion)
    )
      return null
    return {
      actorUid: actorUid as string,
      ownerUid: ownerUid as string,
      childId: childId as string,
      membershipVersion: membershipVersion as number,
    }
  } catch {
    return null
  }
}
