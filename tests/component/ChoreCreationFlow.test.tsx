import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import ChoreCreationFlow from '../../src/pages/ChoreCreationFlow'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'
import { getChoreImage } from '../../src/assets/chores/assets'

afterEach(cleanup)

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
