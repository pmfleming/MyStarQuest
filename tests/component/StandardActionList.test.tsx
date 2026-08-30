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
  })

  it('confirms and exposes a busy state while resetting', async () => {
    let finishReset: (() => void) | undefined
    const reset = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishReset = resolve
        })
    )
    vi.spyOn(window, 'confirm').mockReturnValue(true)

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

    expect(window.confirm).toHaveBeenCalledWith('Reset Arithmetic?')
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

  it('keeps the card visible and reports a failed deletion', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onDelete = vi.fn().mockRejectedValue(new Error('offline'))
    renderList({ onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Arithmetic' }))

    expect(window.confirm).toHaveBeenCalledWith('Delete Arithmetic?')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete failed. Please try again.'
    )
    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Arithmetic' })).toBeVisible()
  })
})
