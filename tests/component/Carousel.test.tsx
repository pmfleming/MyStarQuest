import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Carousel from '../../src/components/ui/Carousel'
import { ThemeContext, themes } from '../../src/contexts/ThemeContext'

const renderCarousel = (onChange = vi.fn()) => {
  render(
    <ThemeContext.Provider
      value={{
        theme: themes.princess,
        currentTheme: 'princess',
        setTheme: vi.fn(),
      }}
    >
      <Carousel
        items={[
          { id: 'a', label: 'First image', icon: <span>A</span> },
          { id: 'b', label: 'Second image', icon: <span>B</span> },
          { id: 'c', label: 'Third image', icon: <span>C</span> },
        ]}
        initialIndex={1}
        onChange={onChange}
      />
    </ThemeContext.Provider>
  )

  return { onChange }
}

describe('Carousel', () => {
  it('uses the side images as navigation controls', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCarousel()

    expect(screen.getByLabelText('Selected: Second image')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next: Third image' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Selected: Third image')).toBeInTheDocument()
    })
    expect(onChange).toHaveBeenLastCalledWith(2)

    await user.click(
      screen.getByRole('button', { name: 'Previous: Second image' })
    )

    await waitFor(() => {
      expect(
        screen.getByLabelText('Selected: Second image')
      ).toBeInTheDocument()
    })
    expect(onChange).toHaveBeenLastCalledWith(1)
  })
})
