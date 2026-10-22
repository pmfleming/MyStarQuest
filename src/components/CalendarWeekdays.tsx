import type { Theme } from '../contexts/ThemeContext'
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
import './CalendarWeekdays.css'

// Monday first. Character pairings are visual mnemonics, not deity identities.
const weekdays = [
  {
    day: 'Monday',
    meaning: 'Moon',
    symbol: moon,
    ping: twinkle,
    name: 'Twinkleping',
    link: 'crescent moon',
  },
  {
    day: 'Tuesday',
    meaning: 'Tyr',
    symbol: courage,
    ping: gogo,
    name: 'Gogoping',
    link: 'courage',
  },
  {
    day: 'Wednesday',
    meaning: 'Odin',
    symbol: wisdom,
    ping: dada,
    name: 'Dadaping',
    link: 'knowledge',
  },
  {
    day: 'Thursday',
    meaning: 'Thor',
    symbol: thunder,
    ping: giggle,
    name: 'Giggleping',
    link: 'lightning hammer',
  },
  {
    day: 'Friday',
    meaning: 'Frigg',
    symbol: love,
    ping: heart,
    name: 'Heartsping',
    link: 'love',
  },
  {
    day: 'Saturday',
    meaning: 'Saturn',
    symbol: saturn,
    ping: hula,
    name: 'Hulaping',
    link: 'rings',
  },
  {
    day: 'Sunday',
    meaning: 'Sun',
    symbol: sun,
    ping: happy,
    name: 'Happying',
    link: 'sunshine',
  },
] as const

export default function CalendarWeekdays({ theme }: { theme: Theme }) {
  return weekdays.map((weekday) => {
    const teenie = theme.id === 'teenie'
    const description = `${weekday.day}: ${weekday.meaning}${teenie ? `; ${weekday.name} represents ${weekday.link}` : `; ${weekday.link}`}`
    return (
      <div
        key={weekday.day}
        className="calendar-weekday"
        role="img"
        aria-label={description}
        title={description}
      >
        <img
          src={teenie ? weekday.ping : weekday.symbol}
          alt=""
          aria-hidden="true"
        />
      </div>
    )
  })
}
