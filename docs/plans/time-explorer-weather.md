# Time Explorer weather button and artwork plan

Prepared 13 September 2026. Status: planned; application code and weather images have not been created. The full generation manifest is [weather-scene-prompts.json](../assets/weather-scene-prompts.json).

## Intended experience

Make the temperature button open a Weather panel. Its icon becomes a small version of the current weather scene, featuring the princess or Heartsping according to the selected theme. The panel displays that scene prominently, with a large temperature in Celsius, a short condition label, city name, today's local date, feels-like temperature and today's high/low. Keep temperature and captions as accessible HTML text so they remain clear at any size.

Use the existing globe and city controls. Amsterdam remains the initial city; selecting Dublin or Taipei updates the weather. Selecting the Sun/Earth view retains the most recently selected city. Both the header thumbnail and the large scene must come from the same weather state.

The image represents current conditions today. The daily high/low provide the day's context. Label the panel “Weather now” and show the data time. Changing the learning clock or calendar must not turn simulated time into a live-weather claim. Today's date is calculated in the selected city's timezone.

## Current code

- `src/pages/TimeExplorerPage.tsx` supports only clock/calendar panels. The thermometer button currently has a no-op handler and the label “Temperature view coming later”; illustrated icons are 27px.
- `src/components/dayNightExplorer/useDayNightExplorerModel.ts` already maintains `activeCalculationCityId`, initially Amsterdam, but does not expose it in its return type. Expose the selected city directly for weather; do not infer it from the globe focus, which can be Earth or Sun.
- `src/lib/dayNightExplorer/dayNightExplorerOptions.ts` supplies coordinates and timezones for Amsterdam, Dublin and Taipei.
- `src/ui/themeAssets.ts` provides both themes' icons. Add a separate typed weather asset resolver for the scene matrix.
- No weather service or hook was found in the inspected source.

## Image set: 38 originals

Generate all 19 rows below for both themes: 18 weather scenes plus one neutral unavailable state. Produce one scene per image, using the existing princess and Heartsping references inspected for this plan. These are proposed app art choices; clothing and props communicate the weather.

| Scene               | Visual treatment                                                 |
| ------------------- | ---------------------------------------------------------------- |
| Sunny               | Character enjoying sunshine beneath a large sun                  |
| Partly cloudy       | Sun peeking between soft clouds                                  |
| Overcast            | Light jacket, broad grey cloud layer                             |
| Drizzle             | Raincoat, umbrella, a few fine droplets                          |
| Rain                | Boots, umbrella, clear raindrops and puddle                      |
| Heavy rain          | Character indoors, heavy rain outside a window                   |
| Thunderstorm        | Cozy indoors, distant lightning and rain outside                 |
| Hail                | Round ice pellets outside a window, distant lightning            |
| Fog                 | Soft mist and faint scenery around a crisp character             |
| Sleet               | Rain and snowflakes together, slushy ground                      |
| Freezing rain       | Liquid drops and an icy branch outside a sheltered doorway       |
| Snow                | Scarf and mittens, distinct snowflakes                           |
| Heavy snow          | Cozy indoors, dense snow and a snowbank outside                  |
| Windy               | Scarf blowing sideways, hat held securely, swirling leaves       |
| Hot                 | Light clothes, shade, fan and water bottle                       |
| Cold                | Puffy coat, hat and mittens, visible breath, dry ground          |
| Clear night         | Moon and stars, gentle blue accents                              |
| Partly cloudy night | Moon partly hidden by clouds                                     |
| Unavailable         | Friendly character and unmarked thermometer, no invented weather |

Use the princess's established 2D storybook style and Heartsping's established softly glossy 3D style. Keep identity, composition scale and weather cues consistent within each theme. Match the weather cue across themes rather than forcing the two art styles to be identical.

Generate square originals with transparent surrounds and compact scene elements. Place the character centrally with a 10% safe inset; use one bold weather cue. Export 768px WebP scenes and 96px thumbnails. Both sizes come from the same original. No numbers or labels baked into artwork. Use neutral lighting for precipitation/fog/wind/cold scenes so they work against day or night panel backgrounds; only the explicit clear/partly-cloudy variants contain a sun or moon.

Save final files under `src/assets/themes/{princess,teenie}/weather/`, with thumbnails in `weather/thumbs/`. Record generated-original locations, final prompts, export sizes and visual-review status in the manifest. Each entry currently has its own complete prompt and output filename, marked planned.

## Weather data and image selection

Proposed provider: Open-Meteo. Request current temperature, apparent temperature, weather code, rain, showers, snowfall, wind speed and `is_day`, plus daily high/low, using the selected city's coordinates and timezone. Current conditions are model estimates. Include visible provider attribution. Verify the appropriate provider access tier when implementing. [Official API documentation](https://open-meteo.com/en/docs).

Map provider codes to art explicitly: 0/1 clear; 2 partly cloudy; 3 overcast; 45/48 fog; 51/53/55 drizzle; 56/57/66/67 freezing rain; 61/63/80/81 rain; 65/82 heavy rain; 71/73/77/85 snow; 75/86 heavy snow; 95 thunderstorm; 96/99 hail with thunder. Hail-code coverage is region-limited. [Provider code definitions](https://open-meteo.com/en/docs#weather_variable_documentation).

Use this deterministic precedence:

1. Invalid, unknown or unavailable condition data selects the neutral scene.
2. Thunder/hail and freezing precipitation take priority over other signals.
3. Sleet is a derived mixed-precipitation scene only when valid rain/showers and snowfall amounts are both positive for the same returned interval. Do not infer it just from a low temperature.
4. Other precipitation and fog retain their own scenes regardless of heat or wind.
5. In dry non-foggy conditions, choose windy at sustained wind >= 30 km/h; otherwise hot at >= 28°C or cold at <= 5°C. These are proposed illustration thresholds, not weather warnings. Keep the cloud condition in the text when one of these scenes wins.
6. Otherwise choose the cloud-cover scene, using `is_day` for clear and partly-cloudy day/night variants.

Keep numeric temperature independent of illustration selection. Missing temperature displays an em dash rather than 0°C. Missing optional wind or temperature must not suppress a valid rain/cloud picture. Windy/hot/cold scenes can have an HTML secondary condition label without generating every possible combination.

## Implementation sequence

1. Generate and inspect all 38 images with the built-in image tool, one call per image. Check the first scene from each theme against its reference, then apply those constraints consistently to the rest. Export and review large and thumbnail sizes.
2. Add weather response validation, normalized types and a pure `getWeatherScene` resolver in `src/lib/weather/`. Keep artwork lookup in `src/ui/weatherAssets.ts`; require all scene keys for both themes at compile time.
3. Expose `weatherCity` from the explorer model. Add `useCurrentWeather` with a cache keyed by city/coordinates/timezone, deduplicated requests and cancellation when the city changes. Prevent slower responses from replacing the newly selected city's data.
4. Add `WeatherPanel` and the third panel state to `TimeExplorerPage.tsx`. Use the selected scene's thumbnail for the temperature button and its full image inside the panel. Preserve the existing globe sizing and panel width. Add a clear accessible button name such as “Show weather: Amsterdam, rain, 16 degrees Celsius”.
5. Load weather when entering Time Explorer, since the header thumbnail needs it. Reuse responses for 15 minutes; refresh when the page becomes visible or a city is selected if stale, and at the selected city's date rollover. Do not refetch on clock ticks, clock dragging, theme changes or globe animation. Fetch only the selected scene image and thumbnail, rather than decoding all assets.
6. Add loading/error states with the neutral image and a retry action. A cached result may be shown for up to two hours with an explicit “Last updated” indication. Older or previous-date data uses the neutral state until refreshed. Avoid presenting yesterday's weather as today's.

## Completion checks

- Every documented provider code and every scene key has a tested mapping, including unknown/null values and precedence combinations.
- Both themes contain the complete image set; each file decodes and has the intended alpha, dimensions and recognizable weather cue.
- The selected city, temperature, caption, large scene and button thumbnail agree. Rapid city changes cannot mix their data.
- Amsterdam/Dublin/Taipei midnight boundaries and day/night transitions use their own timezone and data time.
- Clock/calendar exploration does not change today's live weather; Earth/Sun focus retains the weather city.
- Theme changes update imagery without duplicate network requests.
- Offline, loading, stale, invalid and retry behavior are exercised.
- Inspect 390px phone and desktop layouts, including long captions and negative temperatures. Check that the 27px header art remains recognizable; if needed use a tighter thumbnail crop within the existing button footprint.
- Run focused resolver/component tests, TypeScript, lint and browser interaction checks.

This delivery is the plan and generation manifest. Image generation and application implementation remain the next execution phase.
