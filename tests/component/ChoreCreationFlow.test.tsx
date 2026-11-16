import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import ChoreCreationFlow from '../../src/pages/ChoreCreationFlow'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import { getChoreImage } from '../../src/assets/chores/assets'
import { getMealImage } from '../../src/ui/choreOverviewAssets'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it.each([
  ['breakfast', 'Breakfast', 8],
  ['lunch', 'Lunch', 12],
  ['dinner', 'Dinner', 18],
] as const)(
  'creates a %s chore with its current title and plate image',
  async (meal, title, hour) => {
    vi.useFakeTimers()
    vi.setSystemTime(
      new Date(`2026-11-16T${String(hour).padStart(2, '0')}:00:00Z`)
    )
    const onSave = vi.fn()
    const theme = themes.teenie
    render(
      <ThemeContext.Provider
        value={{ theme, currentTheme: 'teenie', setTheme: vi.fn() }}
      >
        <ChoreCreationFlow
          theme={theme}
          timeZone="UTC"
          isSaving={false}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      </ThemeContext.Provider>
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: title, exact: true }))
      await vi.dynamicImportSettled()
    })
    expect(screen.getByRole('heading', { name: title })).toBeVisible()
    expect(
      screen
        .getByLabelText('Dinner plate portions')
        .querySelector(`image[href="${getMealImage('teenie', meal)}"]`)
    ).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
    expect(onSave).toHaveBeenCalledExactlyOnceWith(
      'eating',
      expect.objectContaining({ title })
    )
  }
)

it.each([
  { themeId: 'princess', title: 'Practice piano', imageKey: 'practicePiano' },
  { themeId: 'princess', title: 'Practice judo', imageKey: 'practiceJudo' },
  { themeId: 'teenie', title: 'Practice piano', imageKey: 'practicePiano' },
  { themeId: 'teenie', title: 'Practice judo', imageKey: 'practiceJudo' },
] as const)(
  'creates $title with the $themeId artwork and standard chore settings',
  ({ themeId, title, imageKey }) => {
    const onSave = vi.fn()
    const theme = themes[themeId]
    render(
      <ThemeContext.Provider
        value={{ theme, currentTheme: themeId, setTheme: vi.fn() }}
      >
        <ChoreCreationFlow
          theme={theme}
          isSaving={false}
          onSave={onSave}
          onCancel={vi.fn()}
        />
      </ThemeContext.Provider>
    )
    const choice = screen.getByRole('button', { name: title, exact: true })
    expect(choice.querySelector('img')).toHaveAttribute(
      'src',
      getChoreImage(imageKey, themeId)
    )
    fireEvent.click(choice)
    expect(screen.getByRole('textbox', { name: 'Chore name' })).toHaveValue(
      title
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }))
    expect(onSave).toHaveBeenCalledExactlyOnceWith('standard', {
      title,
      imageKey,
      starValue: 1,
      schoolDayEnabled: true,
      nonSchoolDayEnabled: true,
      isRepeating: true,
    })
  }
)
