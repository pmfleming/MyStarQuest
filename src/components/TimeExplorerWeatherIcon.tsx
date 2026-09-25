import type { ThemeId } from '../ui/themeOptions'
import type { WeatherScene } from '../lib/weather/weatherConditions'
import teenie from '../assets/themes/teenie/weather-character-live.png'
import princess from '../assets/themes/princess/weather/characters/mild.webp'

const icons: Record<WeatherScene, string> = {
  sunny: '☀️',
  'partly-cloudy': '🌤️',
  overcast: '☁️',
  drizzle: '🌦️',
  rain: '🌧️',
  'heavy-rain': '🌧️',
  thunderstorm: '⛈️',
  hail: '⛈️',
  fog: '🌫️',
  sleet: '🌨️',
  'freezing-rain': '🌧️',
  snow: '🌨️',
  'heavy-snow': '❄️',
  windy: '🌬️',
  hot: '☀️',
  cold: '❄️',
  'clear-night': '🌙',
  'partly-cloudy-night': '☁️🌙',
  unavailable: '❔',
}

export default function TimeExplorerWeatherIcon({
  themeId,
  scene,
}: {
  themeId: ThemeId
  scene: WeatherScene
}) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-16 w-16 max-w-full shrink-0"
    >
      <img
        src={themeId === 'teenie' ? teenie : princess}
        alt=""
        className="h-full w-full object-contain"
      />
      <span
        className="absolute inset-x-0 -bottom-0.5 text-center leading-none drop-shadow-[0_1px_1px_white]"
        style={{ fontSize: scene === 'partly-cloudy-night' ? 25 : 36 }}
      >
        {icons[scene]}
      </span>
    </span>
  )
}
