export type MealPeriod = 'breakfast' | 'lunch' | 'dinner'

export const mealTitles: Record<MealPeriod, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export function getMealPeriod(date: Date, timeZone?: string): MealPeriod {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone,
    }).format(date)
  )
  return hour < 10 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner'
}

export function getMealChoreTitle(
  item: { taskType: string; title: string },
  meal?: MealPeriod
) {
  return item.taskType === 'eating' && meal ? mealTitles[meal] : item.title
}
