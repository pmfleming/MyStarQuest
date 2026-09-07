import * as princess from '../assets/themes/princess/assets'
import type { ThemeId } from './themeOptions'
import type { Season } from '../lib/seasons'
import heart from '../assets/teenie/heart.webp'
import gift from '../assets/teenie/prop/gift.webp'
import tidyingUp from '../assets/themes/princess/tidying-up.webp'
import writing from '../assets/themes/princess/writing.svg'
import brave from '../assets/themes/princess/brave-princess.png'
import gettingDressed from '../assets/themes/princess/getting-dressed-quickly.png'
import dinnerOverview from '../assets/themes/princess/dinner-overview.webp'
import waterToiletOverview from '../assets/themes/princess/water-toilet-check-overview.webp'
import mathsCounter from '../assets/themes/princess/maths-counter.svg'

const princessAssets = {
  background: princess.princessBackground,
  choresIcon: princess.princessChoresIcon,
  rewardsIcon: princess.princessRewardsIcon,
  calendarIcon: princess.princessCalendarIcon,
  clockIcon: princess.princessClockIcon,
  thermometerIcon: princess.princessThermometerIcon,
  childrenIcon: princess.princessChildrenIcon,
  exitIcon: princess.princessExitIcon,
  editIcon: princess.princessEditIcon,
  deleteIcon: princess.princessDeleteIcon,
  resetIcon: princess.princessResetIcon,
  saveIcon: princess.princessSaveIcon,
  themeIcon: princess.princessThemeIcon,
  activeIcon: princess.princessActiveIcon,
  selectIcon: princess.princessSelectIcon,
  buyRewardIcon: princess.princessBuyRewardIcon,
  lockedRewardIcon: princess.princessLockedRewardIcon,
  giveStarIcon: princess.princessGiveStarIcon,
  eatingFullImage: princess.princessEatingFullImage,
  eatingFailImage: princess.princessEatingFailImage,
  eatingBreakfastIcon: princess.princessEatingBreakfastIcon,
  eatingLunchIcon: princess.princessEatingLunchIcon,
  eatingDinnerIcon: princess.princessEatingDinnerIcon,
  plateImage: princess.princessPlateImage,
  biteIcon: princess.princessBiteIcon,
  flaskFullImage: princess.princessFlaskFullImage,
  flaskTwoThirdsImage: princess.princessFlaskTwoThirdsImage,
  flaskOneThirdImage: princess.princessFlaskOneThirdImage,
  drinkSuccessImage: princess.princessDrinkSuccessImage,
  notPeePeeImage: princess.princessNotPeePeeImage,
  didPeePeeImage: princess.princessDidPeePeeImage,
  mathsIcon: princess.princessMathsIcon,
  quizCorrectImage: princess.princessQuizCorrectImage,
  quizIncorrectImage: princess.princessQuizIncorrectImage,
  schoolDayImage: princess.princessSchoolDayImage,
  nonSchoolDaySpringImage: princess.princessNonSchoolDaySpringImage,
  nonSchoolDaySummerImage: princess.princessNonSchoolDaySummerImage,
  nonSchoolDayAutumnImage: princess.princessNonSchoolDayAutumnImage,
  nonSchoolDayWinterImage: princess.princessNonSchoolDayWinterImage,
  tidyingUp,
  writing,
  brave,
  gettingDressed,
  dinnerOverview,
  waterToiletOverview,
  mathsCounter,
  difficultyIcon: mathsCounter,
  placeValueCounter: mathsCounter,
}

export type ThemeAssets = typeof princessAssets
export type ThemeAssetRole = keyof ThemeAssets

const teenieFiles = import.meta.glob<string>(
  '../assets/themes/teenie/**/*.{webp,svg}',
  { eager: true, query: '?url', import: 'default' }
)

const teenieImage = (file: string): string => {
  const image = teenieFiles[`../assets/themes/teenie/${file}`]
  if (!image) throw new Error(`Missing Teenie theme asset: ${file}`)
  return image
}

const teenieRoles = {
  background: 'seasons/spring-daytime.webp',
  choresIcon: 'tidying-up.webp',
  rewardsIcon: '@gift',
  calendarIcon: 'calendar.webp',
  clockIcon: 'clock.svg',
  thermometerIcon: 'thermometer.svg',
  childrenIcon: '@heart',
  exitIcon: 'exit.svg',
  editIcon: 'edit.webp',
  deleteIcon: 'delete.webp',
  resetIcon: 'reset.svg',
  saveIcon: 'save.svg',
  themeIcon: '@heart',
  activeIcon: 'active.webp',
  selectIcon: 'select.svg',
  buyRewardIcon: '@gift',
  lockedRewardIcon: 'locked-reward.webp',
  giveStarIcon: 'quiz-correct.webp',
  eatingFullImage: 'eating-full.webp',
  eatingFailImage: 'eating-fail.webp',
  eatingBreakfastIcon: 'eating-breakfast.webp',
  eatingLunchIcon: 'eating-lunch.webp',
  eatingDinnerIcon: 'dinner-overview.webp',
  plateImage: 'plate.webp',
  biteIcon: 'dinner-overview.webp',
  flaskFullImage: 'flask-full.webp',
  flaskTwoThirdsImage: 'flask-twothirds.webp',
  flaskOneThirdImage: 'flask-onethird.webp',
  drinkSuccessImage: 'drink-success.webp',
  notPeePeeImage: 'notpeepee.webp',
  didPeePeeImage: 'didpeepee.webp',
  mathsIcon: 'schooltime.webp',
  quizCorrectImage: 'quiz-correct.webp',
  quizIncorrectImage: 'quiz-incorrect.webp',
  schoolDayImage: 'schooltime.webp',
  nonSchoolDaySpringImage: 'non-school-spring.webp',
  nonSchoolDaySummerImage: 'non-school-summer.webp',
  nonSchoolDayAutumnImage: 'non-school-autumn.webp',
  nonSchoolDayWinterImage: 'non-school-winter.webp',
  tidyingUp: 'tidying-up.webp',
  writing: 'writing.webp',
  brave: 'brave.webp',
  gettingDressed: 'getting-dressed.webp',
  dinnerOverview: 'dinner-overview.webp',
  waterToiletOverview: 'water-toilet-check-overview.webp',
  mathsCounter: 'royal-symbol.webp',
  difficultyIcon: 'royal-symbol.webp',
  placeValueCounter: 'royal-symbol.webp',
} satisfies Record<ThemeAssetRole, string>

let teenieAssets: ThemeAssets | undefined
export const hasIllustratedTheme = (id: string) =>
  id === 'princess' || id === 'teenie'

export const getThemeAssets = (id: ThemeId | string): ThemeAssets => {
  if (id !== 'teenie') return princessAssets
  if (!teenieAssets) {
    const reused: Record<string, string> = { '@heart': heart, '@gift': gift }
    teenieAssets = Object.fromEntries(
      Object.entries(teenieRoles).map(([role, file]) => [
        role,
        reused[file] ?? teenieImage(file),
      ])
    ) as ThemeAssets
  }
  return teenieAssets
}

export const getThemeAsset = (id: ThemeId | string, role: ThemeAssetRole) =>
  getThemeAssets(id)[role]

const createTeenieActivities = () => ({
  bedtime: teenieImage('bedtime.webp'),
  eatingBreakfast: teenieImage('eating-breakfast.webp'),
  commute: teenieImage('commute.webp'),
  schooltime: teenieImage('schooltime.webp'),
  playing: teenieImage('playing.webp'),
  eatingDinner: teenieImage('dinner-overview.webp'),
  computergames: teenieImage('computergames.webp'),
  bathtime: teenieImage('bathtime.webp'),
  cooking: teenieImage('cooking.webp'),
  washingTeeth: teenieImage('washing-teeth.webp'),
})

const createTeenieBackgrounds = () =>
  Object.fromEntries(
    ['sunrise', 'daytime', 'sunset', 'night'].map((phase) => [
      phase,
      Object.fromEntries(
        ['spring', 'summer', 'autumn', 'winter'].map((season) => [
          season,
          teenieImage(`seasons/${season}-${phase}.webp`),
        ])
      ) as Record<Season, string>,
    ])
  ) as Record<
    'sunrise' | 'daytime' | 'sunset' | 'night',
    Record<Season, string>
  >

let activities: ReturnType<typeof createTeenieActivities> | undefined
let backgrounds: ReturnType<typeof createTeenieBackgrounds> | undefined
export const getTeenieActivities = () =>
  (activities ??= createTeenieActivities())
export const getTeenieBackgrounds = () =>
  (backgrounds ??= createTeenieBackgrounds())
