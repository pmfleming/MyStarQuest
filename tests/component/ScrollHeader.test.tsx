import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import TabContent from '../../src/components/TabContent'
import PageHeader from '../../src/components/PageHeader'
import { themes } from '../../src/contexts/ThemeContext'
import { ActivityTabVisibleContext } from '../../src/contexts/ActivityTabContext'

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(1200)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400)
})
afterEach(() => vi.restoreAllMocks())

function Fixture({ active = true }: { active?: boolean }) {
  return (
    <ActivityTabVisibleContext value={active}>
      <TabContent
        theme={themes.teenie}
        header={<PageHeader theme={themes.teenie} title="Calendar" />}
      >
        <div>Page content</div>
        <div data-testid="nested-scroll">Nested content</div>
      </TabContent>
    </ActivityTabVisibleContext>
  )
}

function setup() {
  const view = render(<Fixture />)
  const region = screen.getByText('Page content').parentElement!
  const header = view.container.querySelector('.scroll-header')!
  const scroll = (top: number) =>
    fireEvent.scroll(region, { target: { scrollTop: top } })
  return { ...view, region, header, scroll }
}

it('tracks each scroll pixel in both directions and keeps the content padding stable', () => {
  const { region, header, scroll } = setup()
  const padding = region.style.paddingTop
  const progress = () =>
    Number(
      (header as HTMLElement).style.getPropertyValue('--scroll-header-progress')
    )
  scroll(20)
  expect(progress()).toBeCloseTo(20 / 79)
  expect(header).toHaveAttribute('data-hidden', 'false')
  scroll(40)
  expect(progress()).toBeCloseTo(40 / 79)
  scroll(37)
  expect(progress()).toBeCloseTo(37 / 79)
  scroll(100)
  expect(progress()).toBe(1)
  expect(header).toHaveAttribute('data-hidden', 'true')
  expect(header).toHaveAttribute('inert')
  scroll(400)
  expect(header).toHaveAttribute('data-hidden', 'true')
  scroll(390)
  expect(progress()).toBeCloseTo(69 / 79)
  expect(header).toHaveAttribute('data-hidden', 'false')
  expect(header).not.toHaveAttribute('inert')
  scroll(311)
  expect(progress()).toBe(0)
  scroll(400)
  scroll(0)
  expect(header).toHaveAttribute('data-hidden', 'false')
  expect(progress()).toBe(0)
  expect(region.style.paddingTop).toBe(padding)
})

it('does not react to nested scrolling or overscroll bounce', () => {
  const { header, scroll } = setup()
  fireEvent.scroll(screen.getByTestId('nested-scroll'), {
    target: { scrollTop: 100 },
  })
  expect(header).toHaveAttribute('data-hidden', 'false')
  scroll(800)
  scroll(850)
  scroll(800)
  expect(header).toHaveAttribute('data-hidden', 'true')
  scroll(780)
  expect(header).toHaveAttribute('data-hidden', 'false')
})

it('reveals controls when returning to a retained tab without remounting content', () => {
  const { rerender, region, header, scroll } = setup()
  scroll(100)
  expect(header).toHaveAttribute('data-hidden', 'true')
  rerender(<Fixture active={false} />)
  rerender(<Fixture />)
  expect(header).toHaveAttribute('data-hidden', 'false')
  expect(screen.getByText('Page content').parentElement).toBe(region)
  expect(region.scrollTop).toBe(100)
  scroll(80)
  expect(header).toHaveAttribute('data-hidden', 'false')
})

it('keeps controls visible when content does not scroll', () => {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(400)
  const { header, scroll } = setup()
  scroll(80)
  expect(header).toHaveAttribute('data-hidden', 'false')
})
