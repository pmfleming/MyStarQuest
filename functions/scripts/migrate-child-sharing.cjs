#!/usr/bin/env node
// Build functions first. Defaults to a read-only report for one named child.
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { SharingService } = require('../lib/sharing/service.js')
const args = process.argv.slice(2)
const value = (flag) => args[args.indexOf(flag) + 1]
for (const flag of ['--project', '--owner', '--child'])
  if (!args.includes(flag) || !value(flag) || value(flag).startsWith('--'))
    throw new Error(`Required: ${flag}`)
if (
  !process.env.FIRESTORE_EMULATOR_HOST &&
  !args.includes('--allow-production')
)
  throw new Error('Use the emulator or explicitly pass --allow-production.')
const projectId = value('--project')
initializeApp({
  projectId,
  ...(!process.env.FIRESTORE_EMULATOR_HOST
    ? { credential: applicationDefault() }
    : {}),
})
new SharingService(getFirestore())
  .prepare(
    { uid: value('--owner') },
    value('--owner'),
    value('--child'),
    !args.includes('--write')
  )
  .then((report) =>
    console.log(
      JSON.stringify(
        {
          projectId,
          ownerUid: value('--owner'),
          childId: value('--child'),
          ...report,
        },
        null,
        2
      )
    )
  )
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
