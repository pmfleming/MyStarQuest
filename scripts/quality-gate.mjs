import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { auditPassed, writeComparison } from './quality-summary.mjs'

const root = process.cwd()
const dependencyRoots = ['node_modules', 'functions/node_modules']
const lens = path.resolve(
  process.env.QUALITY_LENS_CLI ??
    'tmp/quality-lens-latest/dist/bin/ts-react-quality-lens.js'
)
const reference = process.argv[2]
if (!reference) throw new Error('Usage: node scripts/quality-gate.mjs BASE_REF')
const git = (args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
const initialPush = /^0+$/.test(reference)
const base = initialPush
  ? git(['rev-parse', 'HEAD'])
  : git(['merge-base', reference, 'HEAD'])
const configFiles = [
  'ts-react-quality-lens.config.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'package.json',
  'package-lock.json',
]
const configChanged =
  initialPush ||
  git(['diff', '--name-only', base, '--', ...configFiles]).length > 0
const output = path.join(root, 'target/analysis')
fs.rmSync(path.join(output, 'audit.json'), { force: true })
let snapshot
try {
  let project = root
  let mode = 'new blockers'
  let flags = ['--base', base, '--gate', 'new-only']
  if (configChanged) {
    // Identities cannot be compared after config/dependency changes. Require a
    // whole-project pass under the new policy instead of accepting incomplete evidence.
    snapshot = fs.mkdtempSync(path.join(os.tmpdir(), 'mystarquest-quality-'))
    // Preserve history for locality metrics, with no origin/main default base.
    execFileSync(
      'git',
      [
        'clone',
        '--quiet',
        '--shared',
        '--no-checkout',
        '--origin',
        'quality-source',
        root,
        snapshot,
      ],
      { stdio: 'pipe' }
    )
    for (const file of git([
      'ls-files',
      '-z',
      '--cached',
      '--others',
      '--exclude-standard',
    ])
      .split('\0')
      .filter(Boolean)) {
      if (file.startsWith('target/') || file.startsWith('.github/')) continue
      const source = path.join(root, file)
      if (!fs.existsSync(source) || !fs.statSync(source).isFile()) continue
      const destination = path.join(snapshot, file)
      fs.mkdirSync(path.dirname(destination), { recursive: true })
      fs.copyFileSync(source, destination)
    }
    for (const directory of dependencyRoots) {
      const source = path.join(root, directory)
      if (fs.existsSync(source))
        fs.symlinkSync(source, path.join(snapshot, directory), 'junction')
    }
    project = snapshot
    mode = 'all blockers (configuration changed)'
    flags = ['--gate', 'all']
  }
  const result = spawnSync(
    process.execPath,
    [
      lens,
      'audit',
      '--config',
      path.join(project, 'ts-react-quality-lens.config.json'),
      ...flags,
      '--format',
      'markdown',
    ],
    {
      cwd: project,
      stdio: 'inherit',
      env: { ...process.env, VITEST_MAX_WORKERS: '2' },
    }
  )
  if (snapshot) {
    fs.mkdirSync(output, { recursive: true })
    for (const name of fs
      .readdirSync(path.join(snapshot, 'target/analysis'))
      .filter((name) => name.endsWith('.json'))) {
      fs.copyFileSync(
        path.join(snapshot, 'target/analysis', name),
        path.join(output, name)
      )
    }
  }
  const audit = JSON.parse(
    fs.readFileSync(path.join(output, 'audit.json'), 'utf8')
  )
  writeComparison(root, base, mode, audit)
  process.exitCode = result.status === 0 && auditPassed(audit) ? 0 : 1
} finally {
  if (
    snapshot &&
    path.dirname(snapshot) === path.resolve(os.tmpdir()) &&
    path.basename(snapshot).startsWith('mystarquest-quality-')
  ) {
    // Remove the link first: dependency files belong to the live checkout.
    for (const directory of dependencyRoots) {
      const link = path.join(snapshot, directory)
      if (fs.existsSync(link)) fs.unlinkSync(link)
    }
    fs.rmSync(snapshot, { recursive: true, force: true })
  }
}
