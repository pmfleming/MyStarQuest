import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import animals from '../../src/data/creatureCollections/animals'
import insects from '../../src/data/creatureCollections/insects'
import teeniepings from '../../src/data/creatureCollections/teeniepings'
import type { CreatureCollectionData } from '../../src/data/creatureCollections/types'
import { themes } from '../../src/contexts/ThemeContext'

import teeniepingIcon from '../../src/assets/teenie/heart.webp'
import insectIcon from '../../src/assets/animals/butterfly.webp'

const loadCollection = vi.hoisted(() => vi.fn())
vi.mock('../../src/data/creatureCollections/loadCollection', () => ({
  loadCollection,
  getLoadedCollection: (id: string) => (id === 'animals' ? animals : undefined),
}))
vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

const props = () => ({
  theme: themes.princess,
  totalProblems: 2,
  starReward: 3,
  isRunning: true,
  onAdjustProblems: vi.fn(),
  onStarsChange: vi.fn(),
  onComplete: vi.fn(),
})

const deferred = () => {
  let resolve!: (value: CreatureCollectionData) => void
  const promise = new Promise<CreatureCollectionData>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => loadCollection.mockReset())

it.each([
  ['Teeniepings', teeniepingIcon, 'teenieping'],
  ['Insects', insectIcon, 'insect'],
])(
  'uses collection artwork for Next and Finish in %s games',
  async (collection, icon, kind) => {
    loadCollection.mockResolvedValue(
      collection === 'Insects' ? insects : teeniepings
    )
    const p = props()
    const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
    await act(async () =>
      fireEvent.click(screen.getByRole('radio', { name: collection }))
    )
    fireEvent.click(screen.getByRole('radio', { name: '2 Players' }))
    rerender(<AnimalTester {...p} />)
    expect(
      screen.queryByRole('radiogroup', { name: 'Creature collection' })
    ).not.toBeInTheDocument()
    const next = screen.getByRole('button', { name: `Next ${kind}` })
    expect(next.querySelector('img')).toHaveAttribute('src', icon)
    fireEvent.click(next)
    expect(
      screen.getByRole('button', { name: 'Finish game' }).querySelector('img')
    ).toHaveAttribute('src', icon)
    rerender(<AnimalTester {...p} isRunning={false} />)
    expect(
      screen.getByRole('radiogroup', { name: 'Creature collection' })
    ).toBeVisible()
  }
)

it('loads on selection and ignores a late response for an older selection', async () => {
  const insectRequest = deferred()
  const teenieRequest = deferred()
  loadCollection
    .mockReturnValueOnce(insectRequest.promise)
    .mockReturnValueOnce(teenieRequest.promise)
  render(<AnimalTester {...props()} />)
  expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
  expect(loadCollection).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
  expect(screen.getByRole('status')).toHaveAccessibleName('Loading Insects')
  expect(screen.getByRole('status')).toHaveTextContent('')
  expect(screen.getByRole('radio', { name: 'Insects' })).toHaveAttribute(
    'aria-busy',
    'true'
  )
  fireEvent.click(screen.getByRole('radio', { name: 'Teeniepings' }))
  await act(async () => {
    insectRequest.resolve(insects)
  })
  expect(screen.getByRole('status')).toHaveAccessibleName('Loading Teeniepings')
  expect(screen.getByRole('radio', { name: 'Insects' })).not.toHaveAttribute(
    'aria-busy'
  )
  expect(screen.queryByAltText('Ant')).not.toBeInTheDocument()
  await act(async () => {
    teenieRequest.resolve(teeniepings)
  })
  expect(screen.getByAltText('Artping')).toBeInTheDocument()
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
  expect(
    screen.getByRole('radio', { name: 'Teeniepings' })
  ).not.toHaveAttribute('aria-busy')
})

it('lets a failed collection retry without awarding or finishing a game', async () => {
  loadCollection
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(insects)
  const p = props()
  render(<AnimalTester {...p} />)
  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
  })
  expect(screen.getByRole('alert')).toHaveTextContent('Please try again')
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  })
  expect(screen.getByAltText('Ant')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(loadCollection).toHaveBeenCalledTimes(2)
  expect(p.onComplete).not.toHaveBeenCalled()
})

it('can start a solo game while the selected collection is still loading', async () => {
  const request = deferred()
  loadCollection.mockReturnValue(request.promise)
  const p = props()
  const { rerender } = render(<AnimalTester {...p} isRunning={false} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
  fireEvent.click(screen.getByRole('radio', { name: '1 Player' }))
  rerender(<AnimalTester {...p} />)
  expect(screen.getByRole('status')).toBeInTheDocument()
  expect(
    screen.queryByRole('radiogroup', { name: 'Creature collection' })
  ).not.toBeInTheDocument()
  await act(async () => {
    request.resolve(insects)
  })
  expect(screen.getByLabelText('Insect choices')).toBeInTheDocument()
  expect(
    screen.queryByRole('radiogroup', { name: 'Creature collection' })
  ).not.toBeInTheDocument()
  expect(p.onComplete).not.toHaveBeenCalled()
})

it('returning to Animals cancels an outstanding selection', async () => {
  const request = deferred()
  loadCollection.mockReturnValue(request.promise)
  render(<AnimalTester {...props()} />)
  fireEvent.click(screen.getByRole('radio', { name: 'Insects' }))
  fireEvent.click(screen.getByRole('radio', { name: 'Animals' }))
  expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
  await act(async () => {
    request.resolve(insects)
  })
  expect(screen.getByAltText('Alpaca')).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Animals' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
})
