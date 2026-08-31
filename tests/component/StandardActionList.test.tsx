import {
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
  it('renders explicit card regions and image-only aligned actions', () => {
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
    expect(actions[0]).toHaveTextContent('')
    expect(
      actions[0].querySelector('.standard-card-primary-art')
    ).not.toBeNull()
    expect(actions[0].parentElement).toHaveStyle({
      display: 'grid',
      alignItems: 'stretch',
      minHeight: '60px',
    })
    for (const utilityAction of actions.slice(1)) {
      const artwork = utilityAction.querySelector('img')
      expect(artwork).toHaveClass('h-full', 'w-full', 'object-contain')
      expect(artwork).toHaveStyle({ transform: 'scale(1.7)' })
      expect(artwork?.parentElement).toHaveStyle({
        width: '52px',
        height: '52px',
      })
    }
  })

  it('resets immediately and exposes a busy state', async () => {
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
        icon: <img src="/reset.png" alt="" />,
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
  })

  it.each([
    ['princess', themes.princess, 'Royal%20orbit%20reset'],
    ['generic', themes.space, 'assets/global/reset.svg'],
  ])(
    'uses the %s reset artwork when no override is supplied',
    (_, theme, marker) => {
      renderList({
        theme,
        utilityAction: {
          label: 'Reset',
          exits: false,
          variant: 'neutral',
          onClick: vi.fn(),
        },
      })

      const resetButton = screen.getByRole('button', { name: 'Reset' })
      expect(resetButton.querySelector('img')).toHaveAttribute(
        'src',
        expect.stringContaining(marker)
      )
    }
  )

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
