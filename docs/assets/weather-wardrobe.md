# Weather wardrobe

The Princess and Heartsping weather characters each have twenty outfits: ten temperature tiers with dry and waterproof variants. Both themes share the selector in `src/lib/weather/weatherVisuals.ts` and the SVG viewport renderer in `src/components/weather/WeatherScene.tsx`.

## Clothing rules

The calm-weather tiers are below −5°C, −5–0°C, 0–5°C, 5–10°C, 10–15°C, 15–20°C, 20–25°C, 25–30°C, 30–35°C, and 35°C or warmer. Lower boundaries are inclusive. Extreme temperatures retain the coldest or hottest outfit.

Moderate wind (20–39 km/h) selects one warmer clothing tier; strong wind (40 km/h or more) selects two. This is an educational layering heuristic, not a meteorological wind-chill calculation. Active precipitation selects the waterproof variant, including snow, sleet and hail. Hoods keep wet-weather outfits usable in wind without umbrellas. Missing temperature retains the existing 18°C fallback.

## Assets and layout

- `src/assets/themes/princess/weather/wardrobe.png`
- `src/assets/themes/teenie/weather/wardrobe.png`

Each 1122 × 1402 RGBA atlas has four columns and five rows. Cells run left to right, then top to bottom. Each tier occupies two consecutive cells: dry, then waterproof. The renderer crops the selected cell with an SVG viewBox; changing outfits reuses the same image URL. The asset registry imports only these atlases and the existing environment images.

The built-in image generation tool produced the artwork using each theme's existing `weather/characters/mild.webp` as the identity/style reference. Original generated masters remain in the local Codex generated-image directory. The final alpha-bearing exports are copies of `exec-16c0304a-65a4-4b52-be37-e81be5adf7ec.png` (Princess) and `exec-ba683e82-e980-4ec7-ba7c-adcb02182a6a.png` (Heartsping).

## Prompt set

Generate one four-column, five-row wardrobe sprite atlas per character. Preserve the supplied character's identity, theme palette and illustration style. Use full-body front-facing figures, consistent scale and pose, equal cells, clear margins, no text, props, umbrellas or scenery, and genuine transparent backgrounds. Arrange ten consecutive dry/waterproof pairs from coldest to hottest:

1. Expedition parka, mittens and snow boots / waterproof expedition parka.
2. Down coat, hat, scarf and gloves / hooded waterproof down coat.
3. Padded jacket, beanie and gloves / hooded insulated rain jacket.
4. Wool coat and scarf / lined waterproof hooded coat.
5. Fleece jacket and trousers / warm hooded raincoat and rain boots.
6. Light cardigan and leggings / light hooded rain jacket and waterproof shoes.
7. Long-sleeve cotton dress / breathable hooded rain cape.
8. Short-sleeve summer dress and sun hat / light hooded rain cape.
9. Airy summer dress, sun hat and sandals / thin hooded poncho.
10. Loose cotton top, shorts, sun hat and sandals / thin hooded poncho.

The initial exports contained a painted checkerboard. A follow-up background-extraction edit removed it while preserving the twenty characters, outfits, identities, colors, outlines, full bodies, grid positions, scale, alignment and aspect ratio. The edit requested actual RGBA transparency outside the characters, opaque white clothing and eyes, and no new text, objects, shadows or scenery.

## Validation

- All 162 Vitest tests pass with `npm run test -- --maxWorkers=1`; the existing test count is unchanged. The weather component tests now render the real scene and cover both theme assets, waterproof clothing, reset, missing data and control bounds.
- Production build, ESLint and diff whitespace checks pass.
- Browser inspection verified both themes over their landscapes, including moderate rain, warm dry clothing and cold snowy clothing. Both PNGs contain real alpha transparency.
- The initial concurrent build/test run hit the default five-second timeout in one weather test and two unchanged calendar tests. The serial rerun passed with the default timeout.
