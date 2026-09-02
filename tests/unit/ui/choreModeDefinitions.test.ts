import {
  getActivityPrimaryActionLabel,
  getDinnerPrimaryActionLabel,
  getTestPrimaryActionLabel,
  shouldHidePresetChoreStars,
  shouldHidePresetChoreTitle,
  shouldHidePresetPrimaryButton,
  shouldUseResetUtility,
  type ChoreStage,
} from '../../../src/ui/choreModeDefinitions'

describe('chore mode definitions', () => {
  it('matches the shared preset chore mode matrix', () => {
    const stages: ChoreStage[] = ['setup', 'activity', 'completed']
    const presetTypes = [
      'eating',
      'math',
      'large-numbers',
      'positional-notation',
      'alphabet',
      'spelling',
      'animals',
      'watertoiletcheck',
    ] as const

    const matrix = stages.map((stage) => ({
      stage,
      hideTitle: shouldHidePresetChoreTitle(stage),
      hideStars: shouldHidePresetChoreStars(stage),
      usesResetUtility: shouldUseResetUtility(stage),
      hidePrimaryButtonByType: Object.fromEntries(
        presetTypes.map((type) => [
          type,
          shouldHidePresetPrimaryButton(type, stage),
        ])
      ),
    }))

    expect(matrix).toMatchInlineSnapshot(`
      [
        {
          "hidePrimaryButtonByType": {
            "alphabet": false,
            "animals": false,
            "eating": false,
            "large-numbers": false,
            "math": false,
            "positional-notation": false,
            "spelling": false,
            "watertoiletcheck": false,
          },
          "hideStars": false,
          "hideTitle": false,
          "stage": "setup",
          "usesResetUtility": false,
        },
        {
          "hidePrimaryButtonByType": {
            "alphabet": true,
            "animals": true,
            "eating": false,
            "large-numbers": false,
            "math": false,
            "positional-notation": false,
            "spelling": true,
            "watertoiletcheck": false,
          },
          "hideStars": true,
          "hideTitle": true,
          "stage": "activity",
          "usesResetUtility": true,
        },
        {
          "hidePrimaryButtonByType": {
            "alphabet": true,
            "animals": true,
            "eating": true,
            "large-numbers": true,
            "math": true,
            "positional-notation": true,
            "spelling": true,
            "watertoiletcheck": true,
          },
          "hideStars": true,
          "hideTitle": true,
          "stage": "completed",
          "usesResetUtility": true,
        },
      ]
    `)
  })

  it('matches the shared primary action labels', () => {
    expect({
      test: {
        setup: getTestPrimaryActionLabel('setup'),
        activity: getTestPrimaryActionLabel('activity'),
        completed: getTestPrimaryActionLabel('completed'),
      },
      dinner: {
        setup: getDinnerPrimaryActionLabel('setup', false),
        activityRunning: getDinnerPrimaryActionLabel('activity', true),
        activityIdle: getDinnerPrimaryActionLabel('activity', false),
        completed: getDinnerPrimaryActionLabel('completed', false),
      },
      activity: {
        setup: getActivityPrimaryActionLabel('setup'),
        activity: getActivityPrimaryActionLabel('activity'),
        completed: getActivityPrimaryActionLabel('completed'),
      },
    }).toMatchInlineSnapshot(`
      {
        "activity": {
          "activity": "Finish",
          "completed": "Run",
          "setup": "Run",
        },
        "dinner": {
          "activityIdle": "Run",
          "activityRunning": "Bite",
          "completed": "Run",
          "setup": "Run",
        },
        "test": {
          "activity": "Check result",
          "completed": "Run",
          "setup": "Run",
        },
      }
    `)
  })
})
