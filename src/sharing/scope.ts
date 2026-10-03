import { z } from 'zod'
import type { ChildScope } from '../../functions/src/sharing/protocol'
export type { ChildScope } from '../../functions/src/sharing/protocol'
const prefix = 'child-scope:'
const scopeId = z
  .string()
  .min(1)
  .refine((value) => !value.includes('/'))
const scopeTuple = z.tuple([scopeId, scopeId, scopeId, z.number().int()])
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
    const [actorUid, ownerUid, childId, membershipVersion] = scopeTuple.parse(
      JSON.parse(key.slice(prefix.length))
    )
    return { actorUid, ownerUid, childId, membershipVersion }
  } catch {
    return null
  }
}
