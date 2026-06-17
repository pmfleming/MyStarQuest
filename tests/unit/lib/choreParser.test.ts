import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
  DEFAULT_LARGE_NUMBERS_PROBLEMS,
  DEFAULT_MATH_PROBLEMS,
  DEFAULT_PV_PROBLEMS,
  DEFAULT_SPELLING_PROBLEMS,
  DEFAULT_TOILET_STATUS,
  DEFAULT_WATER_LEVEL,
  childSnapshotDataSchema,
  childStarsSnapshotDataSchema,
  resetTodayTodosResultSchema,
  rewardSnapshotDataSchema,
  choreSnapshotDataSchema,
  choreTodoSnapshotDataSchema,
  testSnapshotDataSchema,
} from '../../../src/data/types'
import {
  parseChoreSnapshot,
  parseChoreTodoSnapshot,
  parseTestSnapshot,
} from '../../../src/lib/choreParser'

describe('choreParser', () => {
  it('parses eating chores and applies schema fallbacks for invalid values', () => {
    const chore = parseChoreSnapshot('chore-1', {
      choreType: 'eating',
      title: 123,
      childId: 'child-1',
      category: 'eating',
      schoolDayEnabled: 'yes',
      nonSchoolDayEnabled: true,
      starValue: '3',
      isRepeating: 'no',
      dinnerDurationSeconds: 'bad',
      dinnerTotalBites: null,
    })

    expect(chore).toEqual({
      id: 'chore-1',
      title: '',
      childId: 'child-1',
      category: 'eating',
      schoolDayEnabled: false,
      nonSchoolDayEnabled: true,
      starValue: 1,
      isRepeating: false,
      createdAt: undefined,
      taskType: 'eating',
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
    })
  })

  it('parses specialized test variants through normalized test type detection', () => {
    const mathTest = parseTestSnapshot('test-2', {
      testType: 'math',
      childId: 'child-1',
      mathTotalProblems: 8,
      mathDifficulty: 'hard',
      lastAttemptedAt: 12345,
      lastAttemptDateKey: '2026-06-09',
      lastAttemptOutcome: 'success',
    })

    const alphabetTest = parseTestSnapshot('test-3', {
      testType: 'alphabet',
      childId: 'child-1',
      alphabetTotalProblems: undefined,
    })

    const largeNumbersTest = parseTestSnapshot('test-6', {
      testType: 'large-numbers',
      childId: 'child-1',
      largeNumbersTotalProblems: 4,
    })

    const pvTest = parseTestSnapshot('test-4', {
      testType: 'positional-notation',
      childId: 'child-1',
      pvTotalProblems: 'bad',
    })

    const spellingTest = parseTestSnapshot('test-5', {
      testType: 'spelling',
      childId: 'child-1',
      spellingTotalProblems: undefined,
    })

    expect(mathTest?.taskType).toBe('math')
    expect(mathTest).toMatchObject({
      mathTotalProblems: 8,
      mathDifficulty: 'hard',
      lastAttemptedAt: 12345,
      lastAttemptDateKey: '2026-06-09',
      lastAttemptOutcome: 'success',
    })

    expect(largeNumbersTest?.taskType).toBe('large-numbers')
    expect(largeNumbersTest).toMatchObject({
      largeNumbersTotalProblems: 4,
    })

    expect(alphabetTest?.taskType).toBe('alphabet')
    expect(alphabetTest).toMatchObject({
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
    })

    expect(pvTest?.taskType).toBe('positional-notation')
    expect(pvTest).toMatchObject({
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
    })

    expect(spellingTest?.taskType).toBe('spelling')
    expect(spellingTest).toMatchObject({
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    })
  })

  it('skips obsolete daynight snapshots', () => {
    expect(
      parseChoreSnapshot('obsolete-chore', {
        choreType: 'daynight',
        childId: 'child-1',
      })
    ).toBeNull()

    expect(
      parseChoreTodoSnapshot(
        'obsolete-chore-todo',
        {
          sourceChoreType: 'daynight',
          sourceChoreId: 'obsolete-chore',
          childId: 'child-1',
        },
        '2026-04-01'
      )
    ).toBeNull()
  })

  it('returns null and warns for completely invalid chore or todo payloads', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(parseChoreSnapshot('bad-chore', null as never)).toBeNull()
    expect(
      parseChoreTodoSnapshot('bad-chore-todo', null as never, '2026-04-01')
    ).toBeNull()

    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })

  it('parses chore todos with defaults and fallback date key', () => {
    const todo = parseChoreTodoSnapshot(
      'chore-todo-1',
      {
        sourceChoreType: 'eating',
        sourceChoreId: 'chore-1',
        childId: 'child-1',
        dinnerDurationSeconds: 'bad',
        dinnerRemainingSeconds: undefined,
        dinnerTotalBites: null,
        dinnerBitesLeft: undefined,
      },
      '2026-04-01'
    )

    expect(todo).toEqual({
      id: 'chore-todo-1',
      title: '',
      childId: 'child-1',
      sourceTaskId: 'chore-1',
      starValue: 1,
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
      autoAdded: false,
      completedAt: null,
      dateKey: '2026-04-01',
      createdAt: undefined,
      sourceTaskType: 'eating',
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerRemainingSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
      dinnerBitesLeft: DEFAULT_DINNER_BITES,
      dinnerTimerStartedAt: null,
    })
  })

  it('parses watertoilet chore todos with safe defaults', () => {
    const todo = parseChoreTodoSnapshot(
      'chore-todo-2',
      {
        sourceChoreType: 'watertoiletcheck',
        sourceChoreId: 'chore-2',
        childId: 'child-1',
        waterLevel: 'invalid',
        toiletStatus: 'invalid',
      },
      '2026-04-01'
    )

    expect(todo).toMatchObject({
      sourceTaskType: 'watertoiletcheck',
      waterLevel: DEFAULT_WATER_LEVEL,
      toiletStatus: DEFAULT_TOILET_STATUS,
    })
  })

  it('parses split chore and test templates through compatibility fields', () => {
    const chore = parseChoreSnapshot('chore-1', {
      choreType: 'eating',
      childId: 'child-1',
      dinnerDurationSeconds: 300,
      dinnerTotalBites: 4,
    })

    const test = parseTestSnapshot('test-1', {
      testType: 'math',
      childId: 'child-1',
      mathTotalProblems: 6,
      mathDifficulty: 'hard',
    })

    expect(chore?.taskType).toBe('eating')
    expect(chore).toMatchObject({
      dinnerDurationSeconds: 300,
      dinnerTotalBites: 4,
    })
    expect(test?.taskType).toBe('math')
    expect(test).toMatchObject({
      mathTotalProblems: 6,
      mathDifficulty: 'hard',
    })
  })

  it('parses split chore todos through compatibility fields', () => {
    const choreTodo = parseChoreTodoSnapshot(
      'chore-todo-1',
      {
        sourceChoreId: 'chore-1',
        sourceChoreType: 'watertoiletcheck',
        childId: 'child-1',
      },
      '2026-05-31'
    )

    expect(choreTodo).toMatchObject({
      sourceTaskId: 'chore-1',
      sourceTaskType: 'watertoiletcheck',
      waterLevel: DEFAULT_WATER_LEVEL,
      toiletStatus: DEFAULT_TOILET_STATUS,
    })
  })
})

describe('runtime schemas', () => {
  it('applies defaults for child and reward snapshot data', () => {
    expect(childSnapshotDataSchema.parse({})).toMatchObject({
      displayName: '',
      avatarToken: '⭐',
      totalStars: 0,
    })

    expect(rewardSnapshotDataSchema.parse({})).toMatchObject({
      title: '',
      costStars: 0,
      isRepeating: false,
    })

    expect(
      rewardSnapshotDataSchema.parse({ imageKey: 'yoshiEgg' })
    ).toMatchObject({
      imageKey: 'yoshiEgg',
    })
  })

  it('applies defaults for chore/test and daily todo snapshot schemas', () => {
    expect(choreSnapshotDataSchema.parse({})).toMatchObject({
      title: '',
      childId: '',
      category: '',
      taskType: 'standard',
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
      starValue: 1,
      isRepeating: false,
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    })

    expect(testSnapshotDataSchema.parse({})).toMatchObject({
      title: '',
      childId: '',
      category: '',
      taskType: 'standard',
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
      starValue: 1,
      isRepeating: false,
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    })

    expect(choreTodoSnapshotDataSchema.parse({})).toMatchObject({
      title: '',
      childId: '',
      sourceTaskId: '',
      sourceTaskType: 'standard',
      starValue: 1,
      schoolDayEnabled: false,
      nonSchoolDayEnabled: false,
      autoAdded: false,
      completedAt: null,
      dinnerDurationSeconds: DEFAULT_DINNER_DURATION_SECONDS,
      dinnerTotalBites: DEFAULT_DINNER_BITES,
      dinnerTimerStartedAt: null,
      mathTotalProblems: DEFAULT_MATH_PROBLEMS,
      largeNumbersTotalProblems: DEFAULT_LARGE_NUMBERS_PROBLEMS,
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
      waterLevel: DEFAULT_WATER_LEVEL,
      toiletStatus: DEFAULT_TOILET_STATUS,
    })

    expect(
      choreSnapshotDataSchema.parse({ choreType: 'eating' })
    ).toMatchObject({
      choreType: 'eating',
    })
    expect(testSnapshotDataSchema.parse({ testType: 'math' })).toMatchObject({
      testType: 'math',
    })
    expect(
      choreTodoSnapshotDataSchema.parse({
        sourceChoreId: 'chore-1',
        sourceChoreType: 'standard',
      })
    ).toMatchObject({
      sourceChoreId: 'chore-1',
      sourceChoreType: 'standard',
    })
  })

  it('parses child star snapshots and callable results', () => {
    expect(
      childStarsSnapshotDataSchema.parse({ totalStars: 7 }).totalStars
    ).toBe(7)
    expect(resetTodayTodosResultSchema.parse({ data: { ok: true } })).toEqual({
      data: { ok: true },
    })
  })
})
