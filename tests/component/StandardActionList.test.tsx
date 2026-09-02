import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'

type Item = { id: string; title: string }

const item: Item = { id: 'math-1', title: 'Arithmetic' }
const actionImage = <img src="/run.png" alt="" />

const renderList = (
  overrides: Partial<ComponentProps<typeof StandardActionList<Item>>> = {}
) =>
  render(
    <StandardActionList<Item>
      theme={themes.princess}
      items={[item]}
      getKey={(value) => value.id}
      getItemLabel={(value) => value.title}
      renderHeader={(value) => <h2>{value.title}</h2>}
      renderItem={() => <div aria-label="Activity settings" />}
      primaryAction={{
        label: 'Run',
        ariaLabel: (value) => `Run ${value.title}`,
        icon: actionImage,
        onClick: vi.fn(),
      }}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      addLabel="Add test"
      onAdd={vi.fn()}
      hideAdd
      {...overrides}
    />
  )

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StandardActionList card contract', () => {
  it('renders accessible card regions and hides configured actions', () => {
    renderList()

    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('data-card-shell', 'true')
    expect(card.querySelector('[data-card-region="header"]')).toContainElement(
      screen.getByRole('heading', { name: 'Arithmetic' })
    )
    expect(card.querySelector('[data-card-region="body"]')).toContainElement(
      screen.getByLabelText('Activity settings')
    )

    const footer = card.querySelector('[data-card-region="footer"]')
    expect(footer).not.toBeNull()
    const actions = within(footer as HTMLElement).getAllByRole('button')
    expect(actions.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Run Arithmetic',
      'Edit Arithmetic',
      'Delete Arithmetic',
    ])

    cleanup()
    renderList({
      renderItem: () => (
        <button type="button" className="activity-inline-action">
          Continue
        </button>
      ),
      primaryAction: {
        label: 'Continue',
        hideButton: true,
        onClick: vi.fn(),
      },
      hideEdit: true,
      utilityAction: {
        label: 'Reset',
        exits: false,
        variant: 'neutral',
        onClick: vi.fn(),
      },
    })

    expect(
      screen
        .getAllByRole('button')
        .map(
          (button) => button.getAttribute('aria-label') ?? button.textContent
        )
    ).toEqual(['Continue', 'Reset'])
  })

  it('resets immediately, exposes busy state, and uses themed artwork', async () => {
    let finishReset: (() => void) | undefined
    const reset = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishReset = resolve
        })
    )
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderList({
      utilityAction: {
        label: 'Reset',
        ariaLabel: (value) => `Reset ${value.title}`,
        exits: false,
        variant: 'neutral',
        onClick: reset,
      },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reset Arithmetic' }))

    expect(confirm).not.toHaveBeenCalled()
    expect(reset).toHaveBeenCalledWith(item)
    expect(
      screen.getByRole('button', { name: 'Reset Arithmetic' })
    ).toHaveAttribute('aria-busy', 'true')

    finishReset?.()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reset Arithmetic' })
      ).not.toHaveAttribute('aria-busy')
    )
    expect(
      screen
        .getByRole('button', { name: 'Reset Arithmetic' })
        .querySelector('img')
    ).toHaveAttribute('src', expect.stringContaining('Royal%20orbit%20reset'))

    cleanup()
    renderList({
      theme: themes.space,
      utilityAction: {
        label: 'Reset',
        exits: false,
        variant: 'neutral',
        onClick: vi.fn(),
      },
    })

    expect(
      screen.getByRole('button', { name: 'Reset' }).querySelector('img')
    ).toHaveAttribute('src', expect.stringContaining('assets/global/reset.svg'))
  })

  it('keeps the card visible and reports a failed deletion', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onDelete = vi.fn().mockRejectedValue(new Error('offline'))
    renderList({ onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Arithmetic' }))

    expect(confirm).not.toHaveBeenCalled()
    const card = screen.getByRole('article')
    expect(card).toHaveClass('whimsical-card-exiting')
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.animationEnd(card)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete failed. Please try again.'
    )
    expect(card).not.toHaveClass('whimsical-card-exiting')
    expect(screen.getByRole('heading', { name: 'Arithmetic' })).toBeVisible()
  })

  it('finishes the exit animation before deleting a card', async () => {
    const onDelete = vi.fn()
    renderList({ onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Arithmetic' }))

    const card = screen.getByRole('article')
    expect(card).toHaveClass('whimsical-card-exiting')
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.animationEnd(card)

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(item))
  })
})
