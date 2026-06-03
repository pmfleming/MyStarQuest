import {
  DEFAULT_ALPHABET_PROBLEMS,
  DEFAULT_DINNER_BITES,
  DEFAULT_DINNER_DURATION_SECONDS,
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
  taskSnapshotDataSchema,
  testSnapshotDataSchema,
  testTodoSnapshotDataSchema,
  todoSnapshotDataSchema,
} from '../../../src/data/types'
import {
  parseChoreSnapshot,
  parseChoreTodoSnapshot,
  parseTaskSnapshot,
  parseTestSnapshot,
  parseTestTodoSnapshot,
  parseTodoSnapshot,
} from '../../../src/lib/choreParser'

describe('choreParser', () => {
  it('parses eating tasks and applies schema fallbacks for invalid values', () => {
    const task = parseTaskSnapshot('task-1', {
      taskType: 'eating',
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

    expect(task).toEqual({
      id: 'task-1',
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

  it('parses specialized task variants through normalized task type detection', () => {
    const mathTask = parseTaskSnapshot('task-2', {
      category: 'math',
      childId: 'child-1',
      mathTotalProblems: 8,
      mathDifficulty: 'hard',
    })

    const alphabetTask = parseTaskSnapshot('task-3', {
      taskType: 'alphabet',
      childId: 'child-1',
      alphabetTotalProblems: undefined,
    })

    const pvTask = parseTaskSnapshot('task-4', {
      taskType: 'positional-notation',
      childId: 'child-1',
      pvTotalProblems: 'bad',
    })

    const spellingTask = parseTaskSnapshot('task-5', {
      taskType: 'spelling',
      childId: 'child-1',
      spellingTotalProblems: undefined,
    })

    expect(mathTask?.taskType).toBe('math')
    expect(mathTask).toMatchObject({
      mathTotalProblems: 8,
      mathDifficulty: 'hard',
    })

    expect(alphabetTask?.taskType).toBe('alphabet')
    expect(alphabetTask).toMatchObject({
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
    })

    expect(pvTask?.taskType).toBe('positional-notation')
    expect(pvTask).toMatchObject({
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
    })

    expect(spellingTask?.taskType).toBe('spelling')
    expect(spellingTask).toMatchObject({
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    })
  })

  it('skips legacy daynight snapshots', () => {
    expect(
      parseTaskSnapshot('legacy-task', {
        taskType: 'daynight',
        childId: 'child-1',
      })
    ).toBeNull()

    expect(
      parseTodoSnapshot(
        'legacy-todo',
        {
          sourceTaskType: 'daynight',
          childId: 'child-1',
        },
        '2026-04-01'
      )
    ).toBeNull()
  })

  it('returns null and warns for completely invalid task or todo snapshot payloads', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(parseTaskSnapshot('bad-task', null as never)).toBeNull()
    expect(
      parseTodoSnapshot('bad-todo', null as never, '2026-04-01')
    ).toBeNull()

    expect(warnSpy).toHaveBeenCalledTimes(2)
    warnSpy.mockRestore()
  })

  it('parses todos with defaults and fallback date key', () => {
    const todo = parseTodoSnapshot(
      'todo-1',
      {
        sourceTaskType: 'eating',
        childId: 'child-1',
        sourceTaskId: 'task-1',
        dinnerDurationSeconds: 'bad',
        dinnerRemainingSeconds: undefined,
        dinnerTotalBites: null,
        dinnerBitesLeft: undefined,
      },
      '2026-04-01'
    )

    expect(todo).toEqual({
      id: 'todo-1',
      title: '',
      childId: 'child-1',
      sourceTaskId: 'task-1',
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

  it('parses watertoilet todos with safe defaults', () => {
    const todo = parseTodoSnapshot(
      'todo-2',
      {
        sourceTaskType: 'watertoiletcheck',
        childId: 'child-1',
        sourceTaskId: 'task-2',
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

  it('parses split chore and test todos through compatibility fields', () => {
    const choreTodo = parseChoreTodoSnapshot(
      'chore-todo-1',
      {
        sourceChoreId: 'chore-1',
        sourceChoreType: 'watertoiletcheck',
        childId: 'child-1',
      },
      '2026-05-31'
    )

    const testTodo = parseTestTodoSnapshot(
      'test-todo-1',
      {
        sourceTestId: 'test-1',
        sourceTestType: 'alphabet',
        childId: 'child-1',
        alphabetTotalProblems: 7,
      },
      '2026-05-31'
    )

    expect(choreTodo).toMatchObject({
      sourceTaskId: 'chore-1',
      sourceTaskType: 'watertoiletcheck',
      waterLevel: DEFAULT_WATER_LEVEL,
      toiletStatus: DEFAULT_TOILET_STATUS,
    })
    expect(testTodo).toMatchObject({
      sourceTaskId: 'test-1',
      sourceTaskType: 'alphabet',
      alphabetTotalProblems: 7,
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

  it('applies defaults for task and todo snapshot schemas', () => {
    expect(taskSnapshotDataSchema.parse({})).toMatchObject({
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
      pvTotalProblems: DEFAULT_PV_PROBLEMS,
      alphabetTotalProblems: DEFAULT_ALPHABET_PROBLEMS,
      spellingTotalProblems: DEFAULT_SPELLING_PROBLEMS,
    })

    expect(todoSnapshotDataSchema.parse({})).toMatchObject({
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
    expect(
      testTodoSnapshotDataSchema.parse({
        sourceTestId: 'test-1',
        sourceTestType: 'math',
      })
    ).toMatchObject({
      sourceTestId: 'test-1',
      sourceTestType: 'math',
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
