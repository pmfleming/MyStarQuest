import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPLORER_CITY_OPTIONS } from '../../src/lib/dayNightExplorer/dayNightExplorerOptions'
import type { WeatherSnapshot } from '../../src/lib/weather/weatherStore'

const state = vi.hoisted(() => ({
  cityIndex: 0,
  themeId: 'princess',
  weather: null as WeatherSnapshot | null,
  retry: vi.fn(),
}))
vi.mock('../../src/contexts/ThemeContext', async (original) => {
  const actual =
    await original<typeof import('../../src/contexts/ThemeContext')>()
  return {
    ...actual,
    useTheme: () => ({
      theme: actual.themes[state.themeId as 'princess' | 'teenie'],
    }),
  }
})
vi.mock('../../src/components/TabContent', () => ({
  default: ({
    headerRight,
    children,
  }: {
    headerRight: React.ReactNode
    children: React.ReactNode
  }) => (
    <>
      {headerRight}
      {children}
    </>
  ),
}))
vi.mock('../../src/components/dayNightExplorer/SpinningPlanet', () => ({
  default: () => <div>Globe</div>,
}))
vi.mock('../../src/components/dayNightExplorer/Clock', () => ({
  default: () => <div>Learning clock</div>,
}))
vi.mock('../../src/components/SchoolCalendar', () => ({
  default: () => <div>Learning calendar</div>,
}))
vi.mock(
  '../../src/components/dayNightExplorer/useDayNightExplorerModel',
  () => ({
    default: () => ({
      weatherCity: EXPLORER_CITY_OPTIONS[state.cityIndex],
      planet: {},
      clock: {},
    }),
  })
)
vi.mock('../../src/hooks/useCurrentWeather', () => ({
  useCurrentWeather: () => ({ ...state.weather, retry: state.retry }),
}))
vi.mock('../../src/components/weather/WeatherScene', () => ({
  WeatherScene: ({
    themeId,
    visuals,
    label,
    decorative,
  }: {
    themeId: string
    visuals: { precipitation: string }
    label: string
    decorative: boolean
  }) => (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={label || undefined}
      data-weather-theme={themeId}
      data-precipitation={visuals.precipitation}
    />
  ),
}))

import TimeExplorerPage from '../../src/pages/TimeExplorerPage'

beforeEach(() => {
  state.cityIndex = 0
  state.themeId = 'princess'
  state.retry.mockClear()
  const now = Date.parse('2026-09-13T12:00:00Z')
  state.weather = {
    now,
    loading: false,
    stale: false,
    error: null,
    data: {
      temperature: 16,
      weatherCode: 63,
      isDay: true,
      rain: 3,
      snowfall: 0,
      showers: 0,
      windSpeed: 25,
      high: 20,
      low: 12,
      feelsLike: 15,
      observedAt: now,
      fetchedAt: now,
    },
  }
})

describe('Time Explorer weather panel', () => {
  it('opens weather from its image button and retains clock and calendar navigation', () => {
    render(<TimeExplorerPage />)
    expect(screen.getByText('Learning clock')).toBeInTheDocument()
    const button = screen.getByRole('button', {
      name: /Show weather: Amsterdam, Rain, 16°C/,
    })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('region', { name: 'Weather in Amsterdam' })
    ).toBeInTheDocument()
    expect(screen.queryByText('16°C')).not.toBeInTheDocument()
    expect(screen.queryByText('25 km/h')).not.toBeInTheDocument()
    expect(screen.queryByText(/Weather now/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Princess outdoors: Rain' })
    ).toHaveAttribute('data-precipitation', 'rain')
    fireEvent.click(screen.getByRole('button', { name: 'Show calendar' }))
    expect(screen.getByText('Learning calendar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show clock' }))
    expect(screen.getByText('Learning clock')).toBeInTheDocument()
  })

  it('changes city and theme consistently in the header and panel', () => {
    const { rerender } = render(<TimeExplorerPage />)
    fireEvent.click(screen.getByRole('button', { name: /Show weather:/ }))
    state.cityIndex = 2
    state.themeId = 'teenie'
    rerender(<TimeExplorerPage />)
    expect(
      screen.getByRole('button', { name: /Show weather: Taipei/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Weather in Taipei' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Heartsping outdoors: Rain' })
    ).toHaveAttribute('data-weather-theme', 'teenie')
    expect(
      document.querySelectorAll('[data-weather-theme="teenie"]')
    ).toHaveLength(2)
  })

  it('shows missing weather honestly and allows retry', () => {
    state.weather = {
      ...state.weather!,
      data: null,
      error: 'Could not update the weather.',
    }
    render(<TimeExplorerPage />)
    fireEvent.click(screen.getByRole('button', { name: /Show weather:/ }))
    expect(screen.queryByText('0°C')).not.toBeInTheDocument()
    expect(screen.getByText('Weather unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.retry).toHaveBeenCalledOnce()
  })
})
