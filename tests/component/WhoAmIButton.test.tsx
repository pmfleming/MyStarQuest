import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'
import { getTaskTypeIcon } from '../../src/ui/taskTypeIcons'
import insectImage from '../../src/assets/animals/butterfly.webp'
import teenieImage from '../../src/assets/teenie/heart.webp'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

it('keeps each Who am I button in sync with its collection and restores default artwork on unmount', async () => {
  const theme = themes.teenie
  const noop = () => {}
  const list = (showActivity = true) => (
    <StandardActionList
      theme={theme}
      items={[{ id: 'first' }, { id: 'second' }]}
      getKey={(item) => item.id}
      renderHeader={(item) => <h2>{item.id}</h2>}
      renderItem={() =>
        showActivity ? (
          <AnimalTester
            theme={theme}
            totalProblems={1}
            starReward={1}
            isRunning={false}
            onAdjustProblems={noop}
            onStarsChange={noop}
            onComplete={noop}
          />
        ) : null
      }
      primaryAction={{
        label: 'Start',
        ariaLabel: (item) => `Start ${item.id}`,
        icon: <img src={getTaskTypeIcon('animals', theme.id)} alt="" />,
        onClick: noop,
      }}
      onDelete={noop}
      addLabel="Add"
      onAdd={noop}
      hideAdd
    />
  )
  const view = render(list())
  const firstCard = screen
    .getByRole('heading', { name: 'first' })
    .closest('article')!
  const firstButton = screen.getByRole('button', { name: 'Start first' })
  const secondButton = screen.getByRole('button', { name: 'Start second' })
  const defaultImage = getTaskTypeIcon('animals', theme.id)
  expect(firstButton.querySelector('img')).toHaveAttribute('src', defaultImage)
  for (const [collection, image] of [
    ['Insects', insectImage],
    ['Teeniepings', teenieImage],
    ['Animals', defaultImage],
  ]) {
    await act(async () => {
      fireEvent.click(
        within(firstCard).getByRole('radio', { name: collection })
      )
      await vi.dynamicImportSettled()
    })
    expect(firstButton.querySelector('img')).toHaveAttribute('src', image)
    expect(secondButton.querySelector('img')).toHaveAttribute(
      'src',
      defaultImage
    )
  }
  await act(async () => {
    fireEvent.click(
      within(firstCard).getByRole('radio', { name: 'Teeniepings' })
    )
    await vi.dynamicImportSettled()
  })
  view.rerender(list(false))
  await waitFor(() =>
    expect(firstButton.querySelector('img')).toHaveAttribute(
      'src',
      defaultImage
    )
  )
})
