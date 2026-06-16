import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StarDisplay from '../../src/components/ui/StarDisplay'
import { themes } from '../../src/contexts/ThemeContext'

describe('StarDisplay', () => {
  it('uses a compact editable count only when stars exceed ten', () => {
    const { rerender } = render(
      <StarDisplay
        count={10}
        editable
        theme={themes.princess}
        onChange={() => {}}
      />
    )

    expect(screen.queryByRole('img', { name: '10 stars' })).toBeNull()
    expect(screen.queryByText('10')).toBeNull()

    rerender(
      <StarDisplay
        count={11}
        editable
        theme={themes.princess}
        onChange={() => {}}
      />
    )

    expect(screen.getByRole('img', { name: '11 stars' })).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
  })
})
