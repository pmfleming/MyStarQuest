import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StandardActionList from '../../src/components/ui/StandardActionList'
import { themes } from '../../src/contexts/ThemeContext'
import { getThemeAsset } from '../../src/ui/themeAssets'

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
    expect(
      within(card).getByRole('heading', { name: 'Arithmetic' })
    ).toBeVisible()
    expect(within(card).getByLabelText('Activity settings')).toBeInTheDocument()
    for (const name of [
      'Run Arithmetic',
      'Edit Arithmetic',
      'Delete Arithmetic',
    ]) {
      expect(within(card).getByRole('button', { name })).toBeEnabled()
    }

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

  it('asks before resetting, allows cancellation, and exposes pending state after Yes', async () => {
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
    expect(reset).not.toHaveBeenCalled()
    expect(
      screen.getByRole('button', { name: 'Run Arithmetic' })
    ).toBeDisabled()
    const no = screen.getByRole('button', { name: 'No, keep progress' })
    expect(no).toHaveFocus()
    expect(
      screen.getByRole('button', { name: 'Yes, reset' }).querySelector('img')
    ).toHaveAttribute('src', getThemeAsset('princess', 'quizIncorrectImage'))
    expect(no.querySelector('img')).toHaveAttribute(
      'src',
      getThemeAsset('princess', 'quizCorrectImage')
    )
    fireEvent.click(no)
    expect(reset).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Run Arithmetic' })).toBeEnabled()
    expect(
      screen.getByRole('button', { name: 'Reset Arithmetic' })
    ).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Reset Arithmetic' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
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

  it('uses Teenie artwork and disables inline activity actions while reset is undecided', async () => {
    const user = userEvent.setup()
    const advance = vi.fn()
    const reset = vi.fn()
    renderList({
      theme: themes.teenie,
      hideEdit: true,
      renderItem: () => (
        <button className="activity-inline-action" onClick={advance}>
          Next animal
        </button>
      ),
      primaryAction: { label: 'Continue', hideButton: true, onClick: advance },
      utilityAction: { label: 'Reset', exits: false, onClick: reset },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    const next = screen.getByRole('button', { name: 'Next animal' })
    expect(next).toBeDisabled()
    await user.click(next)
    expect(advance).not.toHaveBeenCalled()
    const no = screen.getByRole('button', { name: 'No, keep progress' })
    expect(no.querySelector('img')).toHaveAttribute(
      'src',
      getThemeAsset('teenie', 'continueActivityImage')
    )
    expect(
      screen.getByRole('button', { name: 'Yes, reset' }).querySelector('img')
    ).toHaveAttribute('src', getThemeAsset('teenie', 'confirmExitImage'))
    fireEvent.click(no)
    expect(next).toBeEnabled()
    fireEvent.click(next)
    expect(advance).toHaveBeenCalledOnce()
    expect(reset).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, reset' }))
    await waitFor(() => expect(reset).toHaveBeenCalledOnce())
  })

  it('keeps the card visible and reports a failed deletion', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onDelete = vi.fn().mockRejectedValue(new Error('offline'))
    renderList({ onDelete })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Arithmetic' }))

    expect(confirm).not.toHaveBeenCalled()
    const card = screen.getByRole('article')
    expect(onDelete).not.toHaveBeenCalled()

    fireEvent.animationEnd(card)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Delete failed. Please try again.'
    )
    expect(screen.getByRole('heading', { name: 'Arithmetic' })).toBeVisible()
  })
})
