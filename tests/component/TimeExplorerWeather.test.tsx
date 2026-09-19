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
const openWeather = async () => {
  fireEvent.click(screen.getByRole('button', { name: /Show weather:/ }))
  await screen.findByRole('region', { name: /Weather in/ })
}

describe('Time Explorer weather panel', () => {
  it('keeps the wardrobe out of clock and calendar entry in both themes', async () => {
    const { container, rerender } = render(<TimeExplorerPage />)
    for (const theme of ['princess', 'teenie']) {
      state.themeId = theme
      rerender(<TimeExplorerPage />)
      clickOption('Show clock')
      expect(container.querySelector('image[href*="wardrobe"]')).toBeNull()
      clickOption('Show calendar')
      expect(container.querySelector('image[href*="wardrobe"]')).toBeNull()
      await openWeather()
      expect(
        container.querySelector('image[href*="wardrobe"]')
      ).toHaveAttribute(
        'href',
        expect.stringContaining(`/${theme}/weather/wardrobe.png`)
      )
    }
  })

  it('adapts precipitation to temperature, preserves intensity and wind, and resets to live weather', async () => {
    const { rerender } = render(<TimeExplorerPage />)
    await openWeather()
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
    clickOption('Cycle wind')
    clickOption('Cycle precipitation')
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
    await openWeather()
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

  it('initializes on arrival of live data and clears exploration on city changes', async () => {
    const response = state.weather!.data
    state.weather = { ...state.weather!, data: null, loading: true }
    const { rerender } = render(<TimeExplorerPage />)
    await openWeather()
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
      screen.getByRole('button', { name: 'Reset to current' })
    ).toBeVisible()

    // Exploration started while the next city's data is loading wins over its response.
    state.cityIndex = 1
    state.weather = { ...state.weather!, data: null, loading: true }
    rerender(<TimeExplorerPage />)
    clickOption('Cycle precipitation', 3)
    state.weather = { ...state.weather!, data: response, loading: false }
    rerender(<TimeExplorerPage />)
    expect(screen.getByLabelText('Precipitation value')).toHaveTextContent(
      'Heavy rain'
    )
    clickOption('Cycle precipitation')
    expect(
      screen
        .getByRole('img', { name: /Your weather/ })
        .querySelector('[data-weather-precipitation]')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Your weather/ })
    ).toHaveAccessibleName(/light cardigan and leggings/)
  })
})
