import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WaterToiletMonitor from '../../src/components/WaterToiletMonitor'

const princessTheme = {
  id: 'princess' as const,
  name: 'Princess',
  colors: {
    primary: '#000',
    secondary: '#111',
    accent: '#222',
    background: '#333',
    surface: '#444',
    text: '#555',
    success: '#666',
    warning: '#777',
    danger: '#888',
  },
  fonts: {
    heading: 'serif',
    body: 'sans-serif',
  },
}

describe('WaterToiletMonitor', () => {
  it('renders every interactive water and toilet state accessibly', () => {
    const { rerender } = render(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="notpeepee"
        starDelta={-6}
        isInteractive
      />
    )

    const waterStates = [
      ['full', 'Full flask', 'flask-full'],
      ['twothirds', 'Two-thirds full flask', 'flask-twothirds'],
      ['onethird', 'One-third full flask', 'flask-onethird'],
      ['empty', 'Empty flask', 'drink-success'],
    ] as const

    for (const [waterLevel, label, assetName] of waterStates) {
      rerender(
        <WaterToiletMonitor
          theme={princessTheme}
          waterLevel={waterLevel}
          toiletStatus="notpeepee"
          starDelta={0}
          isInteractive
        />
      )

      expect(screen.getByAltText(label)).toHaveAttribute(
        'src',
        expect.stringContaining(assetName)
      )
    }

    expect(screen.getByAltText('Has not gone to the toilet')).toHaveAttribute(
      'src',
      expect.stringContaining('notpeepee')
    )

    rerender(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="didpeepee"
        starDelta={0}
        isInteractive
      />
    )

    const completedToiletImage = screen.getByAltText('Has gone to the toilet')
    expect(completedToiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('didpeepee')
    )
  })

  it('shows successful and unsuccessful completed tile states', () => {
    const { rerender } = render(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="empty"
        toiletStatus="didpeepee"
        starDelta={2}
        isInteractive={false}
        isCompleted
      />
    )

    const waterImage = screen.getByAltText('Empty flask')
    const toiletImage = screen.getByAltText('Has gone to the toilet')

    expect(screen.getByRole('button', { name: 'Empty flask' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Has gone to the toilet' })
    ).toBeDisabled()

    expect(waterImage).toHaveAttribute(
      'src',
      expect.stringContaining('drink-success')
    )
    expect(toiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('didpeepee')
    )

    rerender(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="notpeepee"
        starDelta={-6}
        isInteractive={false}
        isCompleted
      />
    )

    const failedWaterImage = screen.getByAltText('Full flask')
    const failedToiletImage = screen.getByAltText('Has not gone to the toilet')

    expect(failedWaterImage).toHaveAttribute(
      'src',
      expect.stringContaining('flask-full')
    )
    expect(failedToiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('notpeepee')
    )
  })
})
