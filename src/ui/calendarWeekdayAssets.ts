import twinklePortrait from '../assets/teenie/twinkle.webp'
import gogoPortrait from '../assets/teenie/gogo.webp'
import dadaPortrait from '../assets/teenie/dada.webp'
import gigglePortrait from '../assets/teenie/giggle.webp'
import heartPortrait from '../assets/teenie/heart.webp'
import hulaPortrait from '../assets/teenie/hula.webp'
import happyPortrait from '../assets/teenie/happy.webp'
import moon from '../assets/calendar/weekdays/mon-princess.svg'
import courage from '../assets/calendar/weekdays/tue-princess.svg'
import wisdom from '../assets/calendar/weekdays/wed-princess.svg'
import thunder from '../assets/calendar/weekdays/thu-princess.svg'
import love from '../assets/calendar/weekdays/fri-princess.svg'
import saturn from '../assets/calendar/weekdays/sat-princess.svg'
import sun from '../assets/calendar/weekdays/sun-princess.svg'
import twinkle from '../assets/calendar/weekdays/mon-teenie.webp'
import gogo from '../assets/calendar/weekdays/tue-teenie.webp'
import dada from '../assets/calendar/weekdays/wed-teenie.webp'
import giggle from '../assets/calendar/weekdays/thu-teenie.webp'
import heart from '../assets/calendar/weekdays/fri-teenie.webp'
import hula from '../assets/calendar/weekdays/sat-teenie.webp'
import happy from '../assets/calendar/weekdays/sun-teenie.webp'

// Monday first. Character pairings are visual mnemonics, not deity identities.
export const calendarWeekdays = [
  {
    day: 'Monday',
    meaning: 'Moon',
    symbol: moon,
    ping: twinkle,
    portrait: twinklePortrait,
    name: 'Twinkleping',
    link: 'crescent moon',
  },
  {
    day: 'Tuesday',
    meaning: 'Tyr',
    symbol: courage,
    ping: gogo,
    portrait: gogoPortrait,
    name: 'Gogoping',
    link: 'courage',
  },
  {
    day: 'Wednesday',
    meaning: 'Odin',
    symbol: wisdom,
    ping: dada,
    portrait: dadaPortrait,
    name: 'Dadaping',
    link: 'knowledge',
  },
  {
    day: 'Thursday',
    meaning: 'Thor',
    symbol: thunder,
    ping: giggle,
    portrait: gigglePortrait,
    name: 'Giggleping',
    link: 'lightning hammer',
  },
  {
    day: 'Friday',
    meaning: 'Frigg',
    symbol: love,
    ping: heart,
    portrait: heartPortrait,
    name: 'Heartsping',
    link: 'love',
  },
  {
    day: 'Saturday',
    meaning: 'Saturn',
    symbol: saturn,
    ping: hula,
    portrait: hulaPortrait,
    name: 'Hulaping',
    link: 'rings',
  },
  {
    day: 'Sunday',
    meaning: 'Sun',
    symbol: sun,
    ping: happy,
    portrait: happyPortrait,
    name: 'Happying',
    link: 'sunshine',
  },
] as const
