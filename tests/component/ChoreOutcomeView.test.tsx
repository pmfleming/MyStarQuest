import { render, screen } from '@testing-library/react'
import ChoreOutcomeView from '../../src/components/ChoreOutcomeView'
import CardShell from '../../src/components/ui/CardShell'
import { themes } from '../../src/contexts/ThemeContext'

describe('ChoreOutcomeView', () => {
  it('fills the card behind the standard footer without moving its buttons', () => {
    render(
      <CardShell
        theme={themes.princess}
        body={
          <ChoreOutcomeView
            imageSrc="/success.webp"
            outcome="success"
            successAlt="Completed"
          />
        }
        footer={<button type="button">Reset</button>}
      />
    )

    const card = screen.getByRole('article')
    const outcome = screen.getByRole('status', { name: 'Completed' })
    const image = outcome.querySelector('img')
    const footer = card.querySelector('[data-card-region="footer"]')

    expect(card).toHaveStyle({
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
    })
    expect(outcome).toHaveStyle({
      width: '100%',
      height: '220px',
    })
    expect(image).toHaveStyle({
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    })
    expect(footer).toHaveStyle({ position: 'relative', zIndex: '1' })
  })
})
