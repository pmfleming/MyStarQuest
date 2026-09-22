import { z } from 'zod'
import { buildDateKey, parseDateKey } from '../../lib/today'

export const TIME_EXPLORER_STORAGE_KEY = 'msq.timeExplorer.v1'

const panelSchema = z.enum(['clock', 'calendar', 'weather', 'globe'])
const citySchema = z.enum(['amsterdam', 'dublin', 'taipei'])
const levelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
])
const weatherDraftSchema = z.object({
  visuals: z.object({
    available: z.boolean(),
    temperature: z.number().finite().nullable(),
    precipitation: z.enum([
      'none',
      'rain',
      'snow',
      'sleet',
      'hail',
      'freezing-rain',
    ]),
    precipitationLevel: levelSchema,
    windLevel: levelSchema,
    cloudLevel: levelSchema,
    isDay: z.boolean(),
    fog: z.boolean(),
    thunder: z.boolean(),
  }),
  windSpeed: z.number().finite().nonnegative().nullable(),
})

const stateSchema = z.object({
  activePanels: z
    .array(panelSchema)
    .max(2)
    .refine((panels) => new Set(panels).size === panels.length)
    .catch(['globe', 'clock']),
  displayMode: z.enum(['earth-focus', 'solar-focus']).catch('earth-focus'),
  activeFocusId: z
    .enum(['sun', 'earth', 'amsterdam', 'dublin', 'taipei'])
    .catch('earth'),
  activeCalculationCityId: citySchema.catch('amsterdam'),
  exploration: z
    .object({
      dateKey: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine(
          (key) =>
            /^\d{4}-\d{2}-\d{2}$/.test(key) &&
            buildDateKey(parseDateKey(key)) === key
        ),
      minutes: z.number().finite().min(0).lt(1440),
      seconds: z.number().finite().min(0).lt(60),
    })
    .nullable()
    .catch(null),
  weather: z
    .object({
      cityId: citySchema,
      draft: weatherDraftSchema,
    })
    .nullable()
    .catch(null),
})

export type ExplorerPanel = z.infer<typeof panelSchema>
export type ExplorerWeatherDraft = z.infer<typeof weatherDraftSchema>
type ExplorerState = z.infer<typeof stateSchema>

export function readTimeExplorerState(): ExplorerState {
  try {
    return stateSchema.parse(
      JSON.parse(localStorage.getItem(TIME_EXPLORER_STORAGE_KEY) ?? '{}')
    )
  } catch {
    return stateSchema.parse({})
  }
}

// Each part of the explorer saves only its own fields, retaining the others.
export function saveTimeExplorerState(patch: Partial<ExplorerState>) {
  try {
    const state = stateSchema.parse({ ...readTimeExplorerState(), ...patch })
    localStorage.setItem(TIME_EXPLORER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage may be disabled or full; exploration must remain usable.
  }
}
