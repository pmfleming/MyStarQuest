import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AnimalTester from '../../src/components/AnimalTester'
import { themes } from '../../src/contexts/ThemeContext'
import animals from '../../src/data/creatureCollections/animals'
import insects from '../../src/data/creatureCollections/insects'

vi.mock('../../src/lib/celebrate', () => ({ celebrateSuccess: vi.fn() }))

describe('Learn display preferences', () => {
  it.each([
    ['princess', 'Animals', 'animal', animals],
    ['teenie', 'Animals', 'animal', animals],
    ['princess', 'Insects', 'insect', insects],
    ['teenie', 'Insects', 'insect', insects],
  ] as const)(
    'retains all three choices for %s / %s through arrows and letter jumps',
    async (themeId, collection, kind, data) => {
      render(
        <AnimalTester
          theme={themes[themeId]}
          totalProblems={1}
          starReward={3}
          isRunning
          onAdjustProblems={vi.fn()}
          onStarsChange={vi.fn()}
          onComplete={vi.fn()}
          onExit={vi.fn()}
        />
      )
      if (collection === 'Insects') {
        await act(async () => {
          fireEvent.click(screen.getByRole('radio', { name: collection }))
          await vi.dynamicImportSettled()
        })
      }
      const abilityLabel = kind === 'animal' ? /^ABILITY:/ : /^SPECIAL:/
      fireEvent.doubleClick(
        screen.getByRole('button', { name: /^View real photo/ })
      )
      fireEvent.click(screen.getByRole('button', { name: abilityLabel }))
      fireEvent.doubleClick(screen.getByRole('button', { name: abilityLabel }))
      const verify = (index: number) => {
        const creature = data.catalog[index]!
        expect(
          screen.getByAltText(`Real ${creature.name.replaceAll('-', ' ')}`)
        ).toBeInTheDocument()
        const ability = screen.getByRole('button', { name: abilityLabel })
        expect(ability).toHaveAttribute('aria-expanded', 'true')
        expect(ability).toHaveAttribute('aria-pressed', 'true')
        const fact = data
          .getTeachingFacts(creature, themeId, true)
          .find((fact) => fact.isAbility)!
        expect(ability.querySelector('img')).toHaveAttribute(
          'src',
          fact.illustration
        )
      }
      fireEvent.click(screen.getByRole('button', { name: `Next ${kind}` }))
      verify(1)
      fireEvent.click(screen.getByRole('button', { name: `Previous ${kind}` }))
      verify(0)
      fireEvent.click(
        screen.getByRole('button', { name: 'Choose starting letter' })
      )
      fireEvent.click(screen.getByRole('button', { name: 'Jump to B' }))
      verify(
        data.catalog.findIndex((creature) => creature.name.startsWith('b'))
      )
      fireEvent.doubleClick(
        screen.getByRole('button', { name: /^View drawing/ })
      )
      fireEvent.doubleClick(screen.getByRole('button', { name: abilityLabel }))
      fireEvent.click(screen.getByRole('button', { name: abilityLabel }))
      fireEvent.click(screen.getByRole('button', { name: `Next ${kind}` }))
      expect(screen.queryByAltText(/^Real /)).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: abilityLabel })
      ).toHaveAttribute('aria-expanded', 'false')
      expect(
        screen.getByRole('button', { name: abilityLabel })
      ).toHaveAttribute('aria-pressed', 'false')
    }
  )
})
