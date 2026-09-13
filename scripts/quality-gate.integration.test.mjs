import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { test } from 'node:test'

test('the pinned Lens permits inherited debt and fails a newly introduced floating promise', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mystarquest-gate-test-'))
  const lens = path.resolve(
    process.env.QUALITY_LENS_CLI ??
      'tmp/quality-lens-latest/dist/bin/ts-react-quality-lens.js'
  )
  const write = (name, content) =>
    fs.writeFileSync(path.join(root, name), content)
  const git = (args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' })
  try {
    fs.mkdirSync(path.join(root, 'src'))
    fs.symlinkSync(
      path.resolve('node_modules'),
      path.join(root, 'node_modules'),
      'junction'
    )
    write('.gitignore', 'node_modules/\ntarget/\n')
    write(
      'package.json',
      '{"name":"quality-gate-fixture","private":true,"type":"module"}'
    )
    write(
      'tsconfig.json',
      '{"compilerOptions":{"target":"ES2022","strict":true,"skipLibCheck":true},"include":["src"]}'
    )
    write(
      'ts-react-quality-lens.config.json',
      JSON.stringify({
        project_name: 'gate fixture',
        project_root: '.',
        source_roots: ['src'],
        test_roots: [],
        tsconfig: 'tsconfig.json',
        test_command: null,
        output_dir: 'target/analysis',
        policy: {
          profile: 'recommended',
          required_checks: ['compiler', 'typed-lint'],
        },
      })
    )
    const legacy = 'export function legacy() { Promise.resolve(1) }\n'
    write('src/example.ts', legacy)
    git(['init', '--quiet'])
    git(['add', '.'])
    git([
      '-c',
      'user.name=Quality fixture',
      '-c',
      'user.email=quality@example.invalid',
      '-c',
      'commit.gpgsign=false',
      'commit',
      '--quiet',
      '-m',
      'Fixture baseline',
    ])
    const audit = () => {
      const run = spawnSync(
        process.execPath,
        [
          lens,
          'audit',
          '--config',
          path.join(root, 'ts-react-quality-lens.config.json'),
          '--base',
          'HEAD',
          '--gate',
          'new-only',
        ],
        { cwd: root, encoding: 'utf8' }
      )
      assert.equal(run.error, undefined)
      const artifact = JSON.parse(
        fs.readFileSync(path.join(root, 'target/analysis/audit.json'), 'utf8')
      )
      assert.equal(
        artifact.summary.complete,
        true,
        JSON.stringify(artifact.summary)
      )
      return { status: run.status, artifact }
    }
    const inherited = audit()
    assert.equal(inherited.status, 0)
    assert.equal(inherited.artifact.summary.blocking_findings, 0)
    write(
      'src/example.ts',
      legacy + 'export function introduced() { Promise.resolve(2) }\n'
    )
    const introduced = audit()
    assert.equal(introduced.status, 1)
    assert.ok(
      introduced.artifact.findings.some(
        (finding) =>
          finding.introduced &&
          finding.disposition === 'block' &&
          finding.rule_id === '@typescript-eslint/no-floating-promises'
      )
    )
    assert.ok(
      introduced.artifact.findings.some(
        (finding) =>
          !finding.introduced &&
          finding.rule_id === '@typescript-eslint/no-floating-promises'
      )
    )
  } finally {
    if (fs.existsSync(path.join(root, 'node_modules')))
      fs.unlinkSync(path.join(root, 'node_modules'))
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()))
    assert.ok(path.basename(root).startsWith('mystarquest-gate-test-'))
    fs.rmSync(root, { recursive: true, force: true })
  }
})
