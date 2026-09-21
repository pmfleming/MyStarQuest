import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from '@capacitor/core'
import {
  parseCalendarSnapshot,
  type SchoolCalendarSnapshot,
} from './schoolCalendarData'

interface SchoolCalendarPlugin {
  read(): Promise<unknown>
  refresh(): Promise<unknown>
  addListener(
    event: 'calendarUpdated',
    listener: (value: unknown) => void
  ): Promise<PluginListenerHandle>
}

const plugin = registerPlugin<SchoolCalendarPlugin>('SchoolCalendar')

export const nativeSchoolCalendar =
  Capacitor.getPlatform() === 'android'
    ? {
        read: async () => parseCalendarSnapshot(await plugin.read()),
        refresh: async () => parseCalendarSnapshot(await plugin.refresh()),
        subscribe: async (
          listener: (snapshot: SchoolCalendarSnapshot) => void
        ) => {
          const handle = await plugin.addListener(
            'calendarUpdated',
            (value) => {
              try {
                listener(parseCalendarSnapshot(value))
              } catch {
                /* Retain valid local data. */
              }
            }
          )
          return () => {
            void handle.remove()
          }
        },
      }
    : undefined
