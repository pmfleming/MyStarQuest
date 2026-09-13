import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPLORER_CITY_OPTIONS } from '../../src/features/dayNightExplorer/dayNightExplorerOptions'
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
vi.mock('../../src/features/dayNightExplorer/SpinningPlanet', () => ({
  default: () => <div>Globe</div>,
}))
vi.mock('../../src/features/dayNightExplorer/Clock', () => ({
  default: () => <div>Learning clock</div>,
}))
vi.mock('../../src/components/SchoolCalendar', () => ({
  default: () => <div>Learning calendar</div>,
}))
vi.mock('../../src/features/dayNightExplorer/useDayNightExplorerModel', () => ({
  default: () => ({
    weatherCity: EXPLORER_CITY_OPTIONS[state.cityIndex],
    planet: {},
    clock: {},
  }),
}))
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
    visuals: {
      precipitation: string
      temperature: number | null
      windLevel: number
      precipitationLevel: number
      thunder: boolean
    }
    label: string
    decorative: boolean
  }) => (
    <div
      role={decorative ? undefined : 'img'}
      aria-label={label || undefined}
      data-weather-theme={themeId}
      data-precipitation={visuals.precipitation}
      data-temperature={visuals.temperature}
      data-wind={visuals.windLevel}
      data-precipitation-level={visuals.precipitationLevel}
      data-thunder={visuals.thunder}
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

const clickOption = (name: string, count = 1) => {
  for (let i = 0; i < count; i++)
    fireEvent.click(screen.getByRole('button', { name }))
}
const openWeather = () =>
  fireEvent.click(screen.getByRole('button', { name: /Show weather:/ }))

describe('Time Explorer weather panel', () => {
  it('changes all three independent scene layers and resets to the latest live response', () => {
    const { rerender } = render(<TimeExplorerPage />)
    openWeather()
    clickOption('Decrease temperature', 21)
    clickOption('Increase wind')
    clickOption('Next precipitation option', 4)
    for (const scene of document.querySelectorAll('[data-weather-theme]')) {
      expect(scene).toHaveAttribute('data-temperature', '-5')
      expect(scene).toHaveAttribute('data-wind', '3')
      expect(scene).toHaveAttribute('data-precipitation', 'snow')
      expect(scene).toHaveAttribute('data-precipitation-level', '3')
    }
    expect(screen.getByRole('img', { name: 'Strong wind' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Heavy snow' })).toBeInTheDocument()
    expect(state.weather!.data!.temperature).toBe(16)
    state.weather = {
      ...state.weather!,
      data: { ...state.weather!.data!, temperature: 22 },
    }
    state.themeId = 'teenie'
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('-5°C')
    expect(
      screen.getByRole('img', { name: /Heartsping outdoors: Your weather/ })
    ).toHaveAttribute('data-precipitation', 'snow')
    expect(screen.getByRole('img', { name: 'Strong wind' })).toHaveAttribute(
      'data-option-theme',
      'teenie'
    )
    expect(screen.getByRole('img', { name: 'Heavy snow' })).toHaveAttribute(
      'data-option-theme',
      'teenie'
    )
    clickOption('Show calendar')
    openWeather()
    expect(screen.getByLabelText('Wind value')).toHaveTextContent('45 km/h')
    clickOption('Reset to current')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('22°C')
    expect(screen.getByLabelText('Wind value')).toHaveTextContent('25 km/h')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate rain'
    )
  })

  it('initializes on arrival of live data and clears exploration on city changes', () => {
    const response = state.weather!.data
    state.weather = { ...state.weather!, data: null, loading: true }
    const { rerender } = render(<TimeExplorerPage />)
    openWeather()
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('—')
    state.weather = { ...state.weather!, data: response, loading: false }
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('16°C')
    clickOption('Increase temperature')
    state.cityIndex = 1
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('16°C')
    expect(
      screen.getByRole('region', { name: 'Weather in Dublin' })
    ).toBeInTheDocument()
    state.cityIndex = 0
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('16°C')
    expect(
      screen.queryByRole('button', { name: 'Reset to current' })
    ).not.toBeInTheDocument()

    // Exploration started while the next city's data is loading wins over its response.
    state.cityIndex = 1
    state.weather = { ...state.weather!, data: null, loading: true }
    rerender(<TimeExplorerPage />)
    clickOption('Next precipitation option', 3)
    state.weather = { ...state.weather!, data: response, loading: false }
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy rain'
    )
    clickOption('Previous precipitation option', 3)
    expect(screen.getByRole('img', { name: /Your weather/ })).toHaveAttribute(
      'data-precipitation-level',
      '0'
    )
  })

  it('stops at the first and last weather options and bounds temperature', () => {
    state.weather!.data!.temperature = 44.8
    const { rerender } = render(<TimeExplorerPage />)
    openWeather()
    clickOption('Increase temperature')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('45°C')
    expect(
      screen.getByRole('button', { name: 'Increase temperature' })
    ).toBeDisabled()
    clickOption('Decrease wind', 2)
    expect(screen.getByLabelText('Wind value')).toHaveTextContent('0 km/h')
    expect(screen.getByRole('button', { name: 'Decrease wind' })).toBeDisabled()
    clickOption('Previous precipitation option', 2)
    expect(
      screen.getByRole('button', { name: 'Previous precipitation option' })
    ).toBeDisabled()
    clickOption('Next precipitation option', 15)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy freezing rain'
    )
    expect(
      screen.getByRole('img', { name: /Princess outdoors: Your weather/ })
    ).toHaveAttribute('data-thunder', 'false')
    expect(
      screen.getByRole('button', { name: 'Next precipitation option' })
    ).toBeDisabled()
    state.weather = {
      ...state.weather!,
      data: { ...state.weather!.data!, temperature: -19.8 },
    }
    rerender(<TimeExplorerPage />)
    clickOption('Reset to current')
    clickOption('Decrease temperature')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent(
      '-20°C'
    )
    expect(
      screen.getByRole('button', { name: 'Decrease temperature' })
    ).toBeDisabled()
  })

  it('shows missing weather honestly and allows retry', () => {
    state.weather = {
      ...state.weather!,
      data: null,
      error: 'Could not update the weather.',
    }
    render(<TimeExplorerPage />)
    openWeather()
    expect(screen.getByText('Weather unavailable')).toBeInTheDocument()
    expect(screen.queryByText('0°C')).not.toBeInTheDocument()
    clickOption('Try again')
    expect(state.retry).toHaveBeenCalledOnce()
  })
})
