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
  it('shows notpeepee while in-chore before toilet completion', () => {
    render(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="notpeepee"
        starDelta={-6}
        isInteractive
      />
    )

    const toiletImage = screen.getByAltText('Has not gone to the toilet')
    expect(toiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('notpeepee')
    )
  })

  it('shows didpeepee while in-chore after toilet completion', () => {
    render(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="didpeepee"
        starDelta={0}
        isInteractive
      />
    )

    const toiletImage = screen.getByAltText('Has gone to the toilet')
    expect(toiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('didpeepee')
    )
  })

  it('shows both water and toilet tiles when the completed state is successful', () => {
    render(
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

    expect(waterImage).toHaveAttribute(
      'src',
      expect.stringContaining('flask-empty')
    )
    expect(toiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('didpeepee')
    )
  })

  it('shows both water and toilet tiles when the completed state is unsuccessful', () => {
    render(
      <WaterToiletMonitor
        theme={princessTheme}
        waterLevel="full"
        toiletStatus="notpeepee"
        starDelta={-6}
        isInteractive={false}
        isCompleted
      />
    )

    const waterImage = screen.getByAltText('Full flask')
    const toiletImage = screen.getByAltText('Has not gone to the toilet')

    expect(waterImage).toHaveAttribute(
      'src',
      expect.stringContaining('flask-full')
    )
    expect(toiletImage).toHaveAttribute(
      'src',
      expect.stringContaining('notpeepee')
    )
  })
})
