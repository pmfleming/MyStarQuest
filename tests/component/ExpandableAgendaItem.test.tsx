import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ExpandableAgendaItem from '../../src/components/ExpandableAgendaItem'

describe('expandable agenda rows', () => {
  it('expands to three times the measured height and collapses on double click or outside interaction', () => {
    render(
      <ul>
        <ExpandableAgendaItem>Breakfast</ExpandableAgendaItem>
      </ul>
    )
    const button = screen.getByRole('button', { name: 'Breakfast' })
    const row = button.closest('li')!
    vi.spyOn(row, 'getBoundingClientRect').mockReturnValue({
      height: 94,
    } as DOMRect)
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.doubleClick(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(row).toHaveStyle({ height: '282px' })
    fireEvent.pointerDown(button)
    fireEvent.click(button)
    expect(row).toHaveStyle({ height: '282px' })
    fireEvent.doubleClick(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(row.style.height).toBe('')
    fireEvent.doubleClick(button)
    expect(row).toHaveStyle({ height: '282px' })
    fireEvent.pointerDown(document.body)
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(row.style.height).toBe('')
  })

  it('collapses the previous row even when another list is clicked', () => {
    render(
      <>
        <ul>
          <ExpandableAgendaItem>School Photos</ExpandableAgendaItem>
        </ul>
        <ol>
          <ExpandableAgendaItem>Sleeping</ExpandableAgendaItem>
        </ol>
      </>
    )
    const photos = screen.getByRole('button', { name: 'School Photos' })
    const sleeping = screen.getByRole('button', { name: 'Sleeping' })
    fireEvent.doubleClick(photos)
    fireEvent.pointerDown(sleeping)
    fireEvent.doubleClick(sleeping)
    expect(photos).toHaveAttribute('aria-expanded', 'false')
    expect(sleeping).toHaveAttribute('aria-expanded', 'true')
  })

  it('supports keyboard expansion, Escape, and focus moving off the row', () => {
    const { unmount } = render(
      <>
        <ul>
          <ExpandableAgendaItem>Sleeping</ExpandableAgendaItem>
        </ul>
        <button>Outside</button>
      </>
    )
    const button = screen.getByRole('button', { name: 'Sleeping' })
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(button, { key: ' ' })
    fireEvent.focusIn(screen.getByRole('button', { name: 'Outside' }))
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(button, { key: 'Enter' })
    unmount()
    // An interrupted interaction must leave no handler touching an unmounted row.
    fireEvent.pointerDown(document.body)
  })
})
