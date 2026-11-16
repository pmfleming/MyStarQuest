import { spawnSync } from 'node:child_process'

// Scan the index so partially staged changes and ignored local secrets are
// handled correctly. Only request filenames; never print matching key values.
const result = spawnSync(
  'git',
  [
    'grep',
    '--cached',
    '--name-only',
    '--null',
    '--text',
    '--extended-regexp',
    '-e',
    'AIza[0-9A-Za-z_-]{35}',
    '--',
    '.',
  ],
  { encoding: 'utf8' }
)

if (result.status === 1) {
  console.log('No Google API keys found in the Git index.')
} else if (result.status === 0) {
  console.error('Google API key detected in staged files:')
  for (const path of result.stdout.split('\0').filter(Boolean)) {
    console.error(`  ${JSON.stringify(path)}`)
  }
  console.error('Remove literal keys and generated bundles before committing.')
  process.exitCode = 1
} else {
  console.error('Could not scan the Git index for Google API keys.')
  process.exitCode = 2
}
