import { expect, it } from 'vitest'
import { getRewardOverlayImage } from '../../src/assets/rewards/assets'

it('matches whole spelling names only for LEGO Pokémon, including spelling’s corrected Growlithe name', () => {
  expect(getRewardOverlayImage(' Pikachu ', 'legoPokemon')).toMatch(
    /pikachu\.png/
  )
  expect(getRewardOverlayImage('GROWLITHE', 'legoPokemon')).toMatch(
    /grrowlithe\.png/
  )
  expect(getRewardOverlayImage('Pikachu prize', 'legoPokemon')).toBeUndefined()
  expect(getRewardOverlayImage('Pikachu', 'pikachu')).toBeUndefined()
})
