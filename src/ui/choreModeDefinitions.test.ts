import {
  getDinnerPrimaryActionLabel,
  getTestPrimaryActionLabel,
  shouldHidePresetChoreStars,
  shouldHidePresetChoreTitle,
  shouldHidePresetPrimaryButton,
  shouldUseResetUtility,
  type ChoreStage,
} from './choreModeDefinitions'

describe('chore mode definitions', () => {
  it('matches the shared preset chore mode matrix', () => {
    const stages: ChoreStage[] = ['setup', 'activity', 'completed']
    const presetTypes = [
      'eating',
      'math',
      'positional-notation',
      'alphabet',
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
            "eating": false,
            "math": false,
            "positional-notation": false,
          },
          "hideStars": false,
          "hideTitle": false,
          "stage": "setup",
          "usesResetUtility": false,
        },
        {
          "hidePrimaryButtonByType": {
            "alphabet": true,
            "eating": false,
            "math": false,
            "positional-notation": false,
          },
          "hideStars": true,
          "hideTitle": true,
          "stage": "activity",
          "usesResetUtility": true,
        },
        {
          "hidePrimaryButtonByType": {
            "alphabet": true,
            "eating": false,
            "math": false,
            "positional-notation": false,
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
    }).toMatchInlineSnapshot(`
      {
        "dinner": {
          "activityIdle": "Start",
          "activityRunning": "Bite",
          "completed": "Again 🔁",
          "setup": "Start",
        },
        "test": {
          "activity": "Check Answer",
          "completed": "Again 🔁",
          "setup": "Start",
        },
      }
    `)
  })
})
