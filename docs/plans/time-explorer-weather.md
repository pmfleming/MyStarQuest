# Time Explorer: live weather and composited artwork

Updated 13 September 2026. The live-weather panel and layered scene renderer are implemented. User-adjustable exploration controls are the next phase.

## Current experience

The temperature button opens **Weather now**. Both its thumbnail and the large panel show the same outdoor princess or Heartsping scene for the selected city and theme. The panel includes Celsius temperature, condition, city-local date, feels-like temperature, wind speed, today's high/low, observation time and provider attribution.

The existing city controls select Amsterdam, Dublin or Taipei. Earth/Sun focus retains the selected weather city. Changing the teaching clock or calendar does not change live weather. The selected city's timezone determines today's date.

## Layered artwork

The original proposal of 38 flattened scenes is superseded. Every character is outdoors in the weather, including storms and heavy precipitation. The application combines these layers:

1. One outdoor garden environment per theme.
2. A transparent character wearing hot, mild, cool, cold, warm-rain or cold-rain clothing: six variants per theme.
3. Independent sun/moon, cloud, fog and lightning layers.
4. Precipitation behind and in front of the character, with light, moderate and heavy levels. Types include rain, snow, sleet, hail and freezing rain.
5. Independent wind levels, with drifting precipitation, wind lines and leaves; ground puddles or snow where appropriate.

This covers sunny, cloudy, overcast, drizzle, rain, heavy rain, thunderstorms, hail, fog, sleet, freezing rain, snow, heavy snow, hot, cold, windy and night conditions without an image for each combination. For example, cold clothing, heavy rain and strong wind can appear together. Missing weather uses a neutral question-mark treatment and missing numeric values display an em dash.

The 14 generated layers are recorded with their complete prompts, source masters, export paths and verification metadata in [weather-layer-prompts.json](../assets/weather-layer-prompts.json). Existing princess and Heartsping art supplied identity references. Character masters used green backgrounds, removed during preparation; production WebP files contain true transparency. No background removal runs in the app. All production layers together are approximately 916 KB.

Files live under `src/assets/themes/{princess,teenie}/weather/`. Re-export with `node scripts/prepare-weather-artwork.mjs` when the generated originals recorded in the manifest are available. The script copies masters into ignored `output/weather/masters`, exports at a maximum dimension of 768px and checks transparency and retained green pixels. The app resolves the selected assets only; it does not decode every clothing variant. The small button shares cached image URLs with the large scene.

## Data and composition

Open-Meteo supplies current temperature, apparent temperature, weather code, rain, showers, snowfall, wind speed and day/night, plus daily high/low. These are model estimates, identified as such in the panel. The current endpoint is appropriate to the personal prototype; a commercial deployment would need the provider's corresponding access tier. [API documentation](https://open-meteo.com/en/docs), [access tiers](https://open-meteo.com/en/pricing).

`src/lib/weather/weatherData.ts` validates responses, uses Unix timestamps and normalizes optional missing values. `weatherStore.ts` caches independently per city/coordinates/timezone, deduplicates requests, cancels inactive requests and protects against city-response races. Responses are reused for 15 minutes and checked on visibility, connection restoration and each active minute. Requests time out after 15 seconds. A stale result is labelled explicitly and retained only within two hours and the same city-local date. Older or previous-date data is removed while refreshing.

`weatherConditions.ts` supplies accessible captions from the provider's documented weather codes. Thunder/hail and freezing precipitation take priority; sleet is derived from simultaneous positive rain and snowfall. Wet conditions keep their captions when it is hot or windy. Unknown codes do not become invented sunny weather. [Provider code definitions](https://open-meteo.com/en/docs#weather_variable_documentation).

`weatherVisuals.ts` creates independent inputs for `WeatherScene`: temperature, precipitation type and level, wind level, cloud level, fog, thunder and day/night. Clothing thresholds are <=5°C cold, <16°C cool, <28°C mild and >=28°C hot; wet clothing has a separate <=10°C cold variant. Wind illustration levels begin at 5, 20 and 40 km/h. These are illustration choices, not warning thresholds. Provider precipitation codes and returned amounts determine initial precipitation intensity.

`WeatherScene.tsx` composites raster artwork with SVG/CSS weather effects. Reduced-motion preferences stop animation, and the header thumbnail stays static. Temperatures and captions remain HTML text. Memoized scene inputs prevent the learning clock's ticks from rebuilding the weather illustration or refetching data.

## Next phase: user-controlled weather exploration

Add an **Explore weather** mode seeded from the current scene. Keep its temporary settings separate from the live response and label the result as imagined weather.

- Temperature: a Celsius slider plus accessible increment/decrement controls; clothing updates while retaining the other weather settings.
- Precipitation: choose rain, snow, sleet, hail or freezing rain, and independently choose none, light, moderate or heavy.
- Wind: choose calm, light, moderate or strong; the amount of precipitation remains unchanged while wind cues and particle drift change.
- Reset: return to the latest live weather and clear temporary overrides. City changes reset the exploration to the new city's conditions; theme changes preserve exploration settings.

Use the existing independent `WeatherVisuals` input, with a separate exploration state. Weather simulation must not write into the live cache or imply that a hypothetical temperature is observed. Further cloud, fog and day/night controls can use the same renderer without generating another matrix of images.

## Verification

- Focused tests cover provider codes, missing and mixed conditions, independent visual inputs, date/age rules, request deduplication, cancellation, midnight rollover, errors, retries and page navigation.
- Browser checks cover both themes, all 12 transparent character exports, city changes, cold heavy rain with strong wind, snow, clear night and error/retry behavior.
- Phone and desktop viewport checks confirm the panel fits and the date follows each city's timezone.
- Production build, TypeScript and targeted lint pass. The Who Am I zoom regression tests also pass.

The earlier Who Am I change and initial weather plan were checkpointed locally in commit `af5fd24` before weather implementation began.
