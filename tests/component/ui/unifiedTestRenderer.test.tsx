import { beforeEach, describe, expect, it, vi } from 'vitest'
import { themes } from '../../../src/contexts/ThemeContext'
import {
  buildDefaultTests,
  buildTestDocument,
} from '../../../src/data/taskDocuments'
import { manageTestOutcomePatch } from '../../../src/data/dailyTaskState'
import { parseTestSnapshot } from '../../../src/lib/choreParser'
import { renderTestContent } from '../../../src/ui/unifiedTestRenderer'
import { createUnifiedChoreState } from '../../../src/ui/unifiedChoreState'
import { createUnifiedChoreDescriptor } from '../../../src/ui/unifiedChoreDescriptors'
import * as renderers from '../../../src/ui/presetChoreRenderers'
import type { UnifiedChoreDeps } from '../../../src/ui/unifiedChoreDescriptorTypes'
import type { TodoRecord } from '../../../src/data/types'

vi.mock('../../../src/ui/presetChoreRenderers', () => ({
  renderArithmeticChore: vi.fn(() => null),
  renderLargeNumbersChore: vi.fn(() => null),
  renderPositionalNotationChore: vi.fn(() => null),
  renderAlphabetChore: vi.fn(() => null),
  renderSpellingChore: vi.fn(() => null),
  renderAnimalsChore: vi.fn(() => null),
  renderDinnerChore: vi.fn(() => null),
  renderWaterToiletChore: vi.fn(() => null),
}))
beforeEach(() => vi.clearAllMocks())

const cases = [
  ['math', 'mathTotalProblems', 'renderArithmeticChore'],
  ['large-numbers', 'largeNumbersTotalProblems', 'renderLargeNumbersChore'],
  ['positional-notation', 'pvTotalProblems', 'renderPositionalNotationChore'],
  ['alphabet', 'alphabetTotalProblems', 'renderAlphabetChore'],
  ['spelling', 'spellingTotalProblems', 'renderSpellingChore'],
  ['animals', 'animalsTotalProblems', 'renderAnimalsChore'],
] as const

describe.each(cases)(
  '%s activity wiring',
  (type, problemField, rendererName) => {
    it('preserves template defaults and routes checks, settings, and outcomes to the selected test', () => {
      const template = buildDefaultTests('child').find(
        (test) => test.taskType === type
      )!
      const stored = parseTestSnapshot(
        template.id,
        buildTestDocument('child', type)
      )!
      expect({ ...stored, createdAt: undefined }).toEqual({
        ...template,
        createdAt: undefined,
      })
      const item = {
        ...template,
        [problemField]: 7,
        ...manageTestOutcomePatch(type, 123, 'failure'),
      }
      const deps: UnifiedChoreDeps = {
        theme: themes.princess,
        mode: 'manage',
        biteCooldownSeconds: 15,
        activeIds: { [type]: item.id },
        checkTriggers: { [type]: { [item.id]: 3 } },
        onCheck: vi.fn(),
        onUpdateTaskField: vi.fn(),
        onComplete: vi.fn(),
        onFail: vi.fn(),
      }
      renderTestContent(deps, createUnifiedChoreState(deps), item, 'completed')
      const props = vi.mocked(renderers[rendererName]).mock.lastCall![0]
      expect(props).toMatchObject({
        totalProblems: 7,
        isRunning: true,
        isCompleted: true,
        isFailed: true,
        checkTrigger: 3,
      })
      props.onAdjustProblems(100)
      props.onAdjustProblems(-100)
      expect(deps.onUpdateTaskField).toHaveBeenNthCalledWith(1, item.id, {
        [problemField]: 9,
      })
      expect(deps.onUpdateTaskField).toHaveBeenNthCalledWith(2, item.id, {
        [problemField]: 1,
      })
      props.onComplete()
      props.onFail?.()
      expect(deps.onComplete).toHaveBeenCalledWith(item)
      expect(deps.onFail).toHaveBeenCalledWith(item)
      const descriptor = createUnifiedChoreDescriptor(deps)
      descriptor.getPrimaryAction(template).onClick(template)
      expect(deps.onCheck).toHaveBeenCalledWith(type, template.id)
      if (type === 'math') {
        const mathProps = vi.mocked(renderers.renderArithmeticChore).mock
          .lastCall![0]
        expect(mathProps.difficulty).toBe('easy')
        mathProps.onDifficultyChange?.('hard')
        expect(deps.onUpdateTaskField).toHaveBeenLastCalledWith(item.id, {
          mathDifficulty: 'hard',
        })
      }

      const noFailure = { ...deps, testFailureModeEnabled: false }
      renderTestContent(
        noFailure,
        createUnifiedChoreState(noFailure),
        item,
        'completed'
      )
      expect(
        vi.mocked(renderers[rendererName]).mock.lastCall![0]
      ).toMatchObject({
        isFailed: false,
        failureModeEnabled: false,
        onFail: undefined,
        failureImage: undefined,
      })
    })
    it('keeps legacy daily tests read-only and renders only their activity or result', () => {
      const template = buildDefaultTests('child').find(
        (test) => test.taskType === type
      )!
      const { taskType, ...fields } = template
      const item = {
        ...fields,
        sourceTaskType: taskType,
        sourceTaskId: template.id,
        completedAt: 123,
        autoAdded: false,
        dateKey: '2026-09-06',
        [problemField.replace('TotalProblems', 'LastOutcome')]: 'failure',
      } as TodoRecord
      const deps: UnifiedChoreDeps = {
        theme: themes.princess,
        mode: 'today',
        biteCooldownSeconds: 15,
        activeIds: { [type]: item.id },
        checkTriggers: {},
        onUpdateTaskField: vi.fn(),
      }
      const state = createUnifiedChoreState(deps)
      expect(renderTestContent(deps, state, item, 'setup')).toBeNull()
      expect(renderers[rendererName]).not.toHaveBeenCalled()
      renderTestContent(deps, state, item, 'completed')
      const props = vi.mocked(renderers[rendererName]).mock.lastCall![0]
      expect(props).toMatchObject({
        totalProblems: 5,
        isEditable: false,
        isCompleted: true,
        isFailed: true,
        checkTrigger: 0,
      })
      props.onAdjustProblems(1)
      props.onStarsChange(1)
      expect(deps.onUpdateTaskField).not.toHaveBeenCalled()
    })
  }
)
