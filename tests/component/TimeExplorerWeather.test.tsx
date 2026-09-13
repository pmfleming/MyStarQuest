import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXPLORER_CITY_OPTIONS } from '../../src/features/dayNightExplorer/dayNightExplorerOptions'
import type { WeatherSnapshot } from '../../src/lib/weather/weatherStore'

const state = vi.hoisted(() => ({
  cityIndex: 0,
  themeId: 'princess',
  selectedDate: new Date(2026, 8, 13),
  weather: null as WeatherSnapshot | null,
  retry: vi.fn(),
}))
vi.mock('../../src/contexts/SelectedDateContext', () => ({
  useSelectedDate: () => ({ selectedDate: state.selectedDate }),
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

import TimeExplorerPage from '../../src/pages/TimeExplorerPage'

beforeEach(() => {
  state.cityIndex = 0
  state.themeId = 'princess'
  state.selectedDate = new Date(2026, 8, 13)
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
  const button = screen.getByRole('button', { name })
  for (let i = 0; i < count; i++) fireEvent.click(button)
}
const openWeather = () =>
  fireEvent.click(screen.getByRole('button', { name: /Show weather:/ }))

describe('Time Explorer weather panel', () => {
  it('adapts precipitation to temperature, preserves intensity and wind, and resets to live weather', () => {
    const { rerender } = render(<TimeExplorerPage />)
    openWeather()
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate rain'
    )
    clickOption('Decrease temperature', 14)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('2°C')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate sleet'
    )
    clickOption('Decrease temperature')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate sleet'
    )
    clickOption('Decrease temperature')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('0°C')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate snow'
    )
    clickOption('Increase temperature', 3)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate rain'
    )
    clickOption('Decrease temperature', 8)
    clickOption('Increase wind')
    clickOption('Next precipitation option')
    const princess = screen.getByRole('img', {
      name: /Princess outdoors: Your weather/,
    })
    expect(princess).toHaveAccessibleName(/waterproof expedition parka/)
    expect(princess.querySelector('image')).toHaveAttribute(
      'href',
      expect.stringContaining('/princess/weather/wardrobe.png')
    )
    expect(
      princess.querySelector('[data-weather-precipitation="snow"]')
    ).toHaveAttribute('data-level', '3')
    expect(
      princess.querySelector('[data-weather-wind="3"]')
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Strong wind' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Strong wind' }).querySelector('img')
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/princess/seasons/autumn-daytime.webp')
    )
    expect(screen.getByRole('img', { name: 'Heavy snow' })).toBeInTheDocument()
    expect(state.weather!.data!.temperature).toBe(16)
    state.weather = {
      ...state.weather!,
      data: { ...state.weather!.data!, temperature: 22 },
    }
    state.themeId = 'teenie'
    state.selectedDate = new Date(2026, 11, 13)
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('-5°C')
    const heartsping = screen.getByRole('img', {
      name: /Heartsping outdoors: Your weather/,
    })
    expect(heartsping).toHaveAccessibleName(/waterproof expedition parka/)
    expect(heartsping.querySelector('image')).toHaveAttribute(
      'href',
      expect.stringContaining('/teenie/weather/wardrobe.png')
    )
    expect(screen.getByRole('img', { name: 'Strong wind' })).toHaveAttribute(
      'data-option-theme',
      'teenie'
    )
    expect(screen.getByRole('img', { name: 'Heavy snow' })).toHaveAttribute(
      'data-option-theme',
      'teenie'
    )
    for (const name of ['Strong wind', 'Heavy snow']) {
      expect(
        screen.getByRole('img', { name }).querySelector('img')
      ).toHaveAttribute(
        'src',
        expect.stringContaining('/teenie/seasons/winter-daytime.webp')
      )
    }
    clickOption('Show calendar')
    openWeather()
    expect(screen.getByLabelText('Wind value')).toHaveTextContent('45 km/h')
    clickOption('Reset to current')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent('22°C')
    expect(screen.getByLabelText('Wind value')).toHaveTextContent('25 km/h')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate rain'
    )
    expect(
      screen.getByRole('img', { name: /Heartsping outdoors:/ })
    ).toHaveAccessibleName(/light hooded rain jacket/)
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
    expect(
      screen
        .getByRole('img', { name: /Your weather/ })
        .querySelector('[data-weather-precipitation]')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Your weather/ })
    ).toHaveAccessibleName(/light cardigan and leggings/)
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
    clickOption('Decrease temperature')
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'None'
    )
    clickOption('Next precipitation option', 6)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy rain'
    )
    expect(
      screen.getByRole('img', { name: /Princess outdoors: Your weather/ })
    ).toHaveAccessibleName(/thin hooded poncho/)
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
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Moderate snow'
    )
    clickOption('Next precipitation option', 7)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy snow'
    )
    expect(
      screen.getByRole('button', { name: 'Next precipitation option' })
    ).toBeDisabled()
    clickOption('Increase temperature', 23)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy rain'
    )

    // Hail from live weather must not bypass the set temperature's only type.
    state.weather = {
      ...state.weather!,
      data: { ...state.weather!.data!, temperature: 2.9, weatherCode: 99 },
    }
    rerender(<TimeExplorerPage />)
    clickOption('Reset to current')
    clickOption('Decrease temperature')
    expect(screen.getByLabelText('Temperature value')).toHaveTextContent(
      '1.9°C'
    )
    expect(screen.getByRole('img', { name: 'Heavy sleet' })).toBeInTheDocument()
    const scene = screen.getByRole('img', {
      name: /Princess outdoors: Your weather/,
    })
    expect(scene.querySelector('[data-weather-precipitation]')).toHaveAttribute(
      'data-weather-precipitation',
      'sleet'
    )
    expect(
      screen.getByRole('button', { name: 'Next precipitation option' })
    ).toBeDisabled()
    clickOption('Decrease temperature', 2)
    expect(screen.getByRole('img', { name: 'Heavy snow' })).toBeInTheDocument()
    clickOption('Increase temperature', 3)
    expect(screen.getByRole('img', { name: 'Heavy rain' })).toBeInTheDocument()
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
