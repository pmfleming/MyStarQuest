# Time Explorer: live weather and composited artwork

Updated 13 September 2026. The live-weather panel, layered scene renderer and three adjustable weather controls are implemented.

## Current experience

The temperature button opens the weather illustration. Both its thumbnail and the large panel show the same outdoor princess or Heartsping scene for the selected city and theme. The large information section was removed at the user's request. Three controls below the image now start from current conditions and update both images immediately. The button's accessible name retains the city and describes the selected weather; retry is available when weather cannot be loaded.

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

The control buttons use miniature outdoor character scenes matching the active theme. Two additional wind portraits were generated with the built-in image tool: the princess retains her shaded storybook illustration style, and Heartsping retains her glossy 3D style. Their poses show hair and scarves blowing. Precipitation options reuse the established raincoat and winter character layers, with rain, snow or ice effects at the selected intensity. All 40 combinations of theme and control option use character artwork rather than generic tree/cloud icons. The additional portraits total approximately 161 KB; source paths, production paths and complete prompts are in [weather-option-prompts.json](../assets/weather-option-prompts.json). Re-export them with `node scripts/prepare-weather-artwork.mjs docs/assets/weather-option-prompts.json`.

Files live under `src/assets/themes/{princess,teenie}/weather/`. Re-export with `node scripts/prepare-weather-artwork.mjs` when the generated originals recorded in the manifest are available. The script copies masters into ignored `output/weather/masters`, exports at a maximum dimension of 768px and checks transparency and retained green pixels. The app resolves the selected assets only; it does not decode every clothing variant. The small button shares cached image URLs with the large scene.

## Data and composition

Open-Meteo supplies current temperature, apparent temperature, weather code, rain, showers, snowfall, wind speed and day/night, plus daily high/low. These are model estimates. The current endpoint is appropriate to the personal prototype; a commercial deployment would need the provider's corresponding access tier. [API documentation](https://open-meteo.com/en/docs), [access tiers](https://open-meteo.com/en/pricing).

`src/lib/weather/weatherData.ts` validates responses, uses Unix timestamps and normalizes optional missing values. `weatherStore.ts` caches independently per city/coordinates/timezone, deduplicates requests, cancels inactive requests and protects against city-response races. Responses are reused for 15 minutes and checked on visibility, connection restoration and each active minute. Requests time out after 15 seconds. A stale result is labelled explicitly and retained only within two hours and the same city-local date. Older or previous-date data is removed while refreshing.

`weatherConditions.ts` supplies accessible captions from the provider's documented weather codes. Thunder/hail and freezing precipitation take priority; sleet is derived from simultaneous positive rain and snowfall. Wet conditions keep their captions when it is hot or windy. Unknown codes do not become invented sunny weather. [Provider code definitions](https://open-meteo.com/en/docs#weather_variable_documentation).

`weatherVisuals.ts` creates independent inputs for `WeatherScene`: temperature, precipitation type and level, wind level, cloud level, fog, thunder and day/night. Clothing thresholds are <=5°C cold, <16°C cool, <28°C mild and >=28°C hot; wet clothing has a separate <=10°C cold variant. Wind illustration levels begin at 5, 20 and 40 km/h. These are illustration choices, not warning thresholds. Provider precipitation codes and returned amounts determine initial precipitation intensity.

`WeatherScene.tsx` composites raster artwork with SVG/CSS weather effects. Reduced-motion preferences stop animation, and the header thumbnail stays static. Temperatures and captions remain HTML text. Memoized scene inputs prevent the learning clock's ticks from rebuilding the weather illustration or refetching data.

## User-controlled weather exploration

The controls initially follow the live response, including when it arrives after the page opens. The first adjustment captures the current scene in separate local exploration state, labelled **Your weather**. Later live responses do not overwrite an exploration in progress.

- Temperature: up/down buttons change the temperature by one Celsius degree, between -20 and 45 degrees. The current decimal temperature is shown initially. Clothing changes while the other weather settings remain selected.
- Wind: up/down buttons choose calm, light, moderate or strong wind, represented by the active theme's character with blowing hair and scarf plus increasing wind lines. The current speed is shown initially; manual levels use 0, 10, 25 and 45 km/h.
- Precipitation: up/down buttons move through illustrated options: none, then light/moderate/heavy rain, snow, sleet, hail and freezing rain. The active theme's character wears a raincoat or winter outfit, with droplet, snowflake or hail density distinguishing intensity. It starts with the provider's current precipitation type and intensity.
- Reset to current: return to the latest live weather and clear temporary overrides. City changes reset exploration; theme and clock/calendar tab changes preserve it.

The three controls sit side by side, each with a labelled up button, its value or illustration and a down button. Buttons have at least 44px touch targets and support keyboard activation. The first and last options disable the relevant arrow. Missing initial values are labelled unavailable; manual exploration is still possible using explicit hypothetical defaults. `useWeatherExploration` keeps adjustments separate from the live cache and shares them between the header and panel. Further cloud, fog and day/night controls can use the same renderer without generating another matrix of images.

## Verification

- Focused tests cover provider codes, missing and mixed conditions, independent visual inputs, date/age rules, request deduplication, cancellation, midnight rollover, errors, retries and page navigation.
- Control tests cover initial values, delayed data, independent adjustments, refresh isolation, reset, theme changes, tab persistence, city changes and button limits. Browser checks exercise pointer and keyboard activation, illustrated precipitation options, both themes and image updates without extra network requests. The three controls fit both 320px and 390px phone viewports.
- Browser checks cover both themes, all 12 transparent character exports, city changes, cold heavy rain with strong wind, snow, clear night and error/retry behavior.
- Phone and desktop viewport checks confirm the panel fits and the date follows each city's timezone.
- Production build, TypeScript and targeted lint pass. The Who Am I zoom regression tests also pass.

The earlier Who Am I change and initial weather plan were checkpointed locally in commit `af5fd24` before weather implementation began.
