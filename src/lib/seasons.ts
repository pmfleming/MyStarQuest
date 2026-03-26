export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export function getSeason(date: Date): Season {
  const month = date.getMonth()
  // Northern Hemisphere
  if (month >= 2 && month <= 4) return 'spring' // March, April, May
  if (month >= 5 && month <= 7) return 'summer' // June, July, August
  if (month >= 8 && month <= 10) return 'autumn' // September, October, November
  return 'winter' // December, January, February
}
