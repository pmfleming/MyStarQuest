import full0 from '../assets/themes/princess/practice-judo.webp'
import small0 from '../assets/themes/princess/practice-judo-256.webp'
import full1 from '../assets/themes/princess/practice-piano.webp'
import small1 from '../assets/themes/princess/practice-piano-256.webp'
import full2 from '../assets/themes/teenie/practice-judo.webp'
import small2 from '../assets/themes/teenie/practice-judo-256.webp'
import full3 from '../assets/themes/teenie/practice-piano.webp'
import small3 from '../assets/themes/teenie/practice-piano-256.webp'
import full4 from '../assets/rewards/claw-game-princess.webp'
import small4 from '../assets/rewards/claw-game-princess-256.webp'
import full5 from '../assets/rewards/claw-game-teenie.webp'
import small5 from '../assets/rewards/claw-game-teenie-256.webp'

const variants = new Map([
  [full0, `${small0} 256w, ${full0} 768w`],
  [full1, `${small1} 256w, ${full1} 768w`],
  [full2, `${small2} 256w, ${full2} 768w`],
  [full3, `${small3} 256w, ${full3} 768w`],
  [full4, `${small4} 256w, ${full4} 768w`],
  [full5, `${small5} 256w, ${full5} 768w`],
])

export const artworkSrcSet = (src?: string) =>
  src ? variants.get(src) : undefined
