import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import dinosaurs from '../../src/data/creatureCollections/dinosaurs'
import { themes } from '../../src/contexts/ThemeContext'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))
vi.mock('../../src/lib/shuffle', () => ({
  shuffle: <T extends { name: string }>(items: T[]) =>
    [...items].sort(
      (left, right) =>
        Number(right.name === 'digosaurus') - Number(left.name === 'digosaurus')
    ),
}))

afterEach(() => vi.useRealTimers())

const props = (theme: keyof typeof themes = 'princess') => ({
  theme: themes[theme],
  totalProblems: 1,
  starReward: 3,
  isRunning: true,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
})

it.each(['princess', 'teenie'] as const)(
  'switches Digosaurus portraits and both ability illustrations in %s',
  async (theme) => {
    render(<AnimalTester {...props(theme)} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Dinosaurs' }))
    await screen.findByAltText('Ankylosaurus')
    fireEvent.click(
      screen.getByRole('button', { name: 'Choose starting letter' })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Jump to D' }))

    expect(screen.getByAltText('Digosaurus')).toHaveAttribute(
      'src',
      expect.stringContaining('/cartoon/digosaurus.png')
    )
    const portrait = screen.getByRole('button', {
      name: 'View realistic illustration of Digosaurus',
    })
    expect(portrait).toHaveAccessibleDescription(/imaginary dinosaur/i)
    fireEvent.click(portrait, { detail: 0 })
    expect(
      screen.getByAltText('Digosaurus realistic illustration')
    ).toHaveAttribute(
      'src',
      expect.stringContaining('/realistic/digosaurus.png')
    )
    expect(portrait).toHaveAccessibleName('View cartoon of Digosaurus')
    fireEvent.click(portrait, { detail: 0 })
    expect(screen.getByAltText('Digosaurus')).toHaveAttribute(
      'src',
      expect.stringContaining('/cartoon/digosaurus.png')
    )
    expect(screen.queryByRole('button', { name: /reconstruction/ })).toBeNull()
    expect(
      screen.queryByRole('button', { name: /^GEOLOGICAL PERIOD:/ })
    ).toBeNull()
    expect(screen.getByText('Roots & leaves')).toBeInTheDocument()
    expect(screen.getByText('Forest burrows')).toBeInTheDocument()

    const digging = screen.getByRole('button', {
      name: /^ABILITY: My strong legs/,
    })
    const flying = screen.getByRole('button', { name: /^FLIGHT: My strong/ })
    expect(digging.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/abilities/digosaurus.png')
    )
    fireEvent.click(digging, { detail: 0 })
    expect(digging.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining(`/${theme}/dig.webp`)
    )
    expect(flying.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining(`/${theme}/fly.webp`)
    )
    fireEvent.click(flying, { detail: 0 })
    expect(flying.querySelector('img')).toHaveAttribute(
      'src',
      expect.stringContaining('/cartoon/digosaurus.png')
    )
  }
)

it('reveals both Digosaurus abilities in hard solo play', async () => {
  const p = props()
  const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Dinosaurs' }))
  })
  vi.useFakeTimers()
  fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Hard' }))
  rerender(<AnimalTester {...p} />)
  expect(
    screen.getByRole('button', { name: 'Digosaurus' }).querySelector('img')
  ).toHaveAttribute('src', expect.stringContaining('/realistic/digosaurus.png'))
  expect(screen.queryByText('Strong digging')).toBeNull()
  act(() => vi.advanceTimersByTime(9000))
  expect(screen.getByText('Strong digging')).toBeInTheDocument()
  expect(screen.getByText('Powerful flying')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: /^ABILITY:/ }).querySelector('img')
  ).toHaveAttribute('src', expect.stringContaining('/princess/dig.webp'))
  expect(
    screen.getByRole('button', { name: /^FLIGHT:/ }).querySelector('img')
  ).toHaveAttribute('src', expect.stringContaining('/princess/fly.webp'))
})

it('keeps real dinosaur period and reconstruction cards available in both themes', () => {
  for (const animal of dinosaurs.catalog) {
    for (const theme of ['princess', 'teenie'] as const) {
      const facts = dinosaurs.getTeachingFacts(animal, theme, true)
      expect(facts).toHaveLength(4)
      expect(facts.every((fact) => Boolean(fact.illustration))).toBe(true)
      if (animal.kind === 'prehistoric' && !animal.fictional) {
        expect(
          facts.find((fact) => fact.label === 'GEOLOGICAL PERIOD')
        ).toBeDefined()
        expect(animal.realisticImage).toContain('/realistic/')
      }
    }
  }
})
