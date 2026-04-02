# Earth Texture Design Spec

This document defines the image requirements for replacing the current generated landmass in the 3D Earth view.

The current renderer in `src/components/dayNightExplorer/SolarSystem3DManager.ts` builds an Earth texture at `2048 x 1024`, so all replacement assets should target that same base format unless there is a deliberate renderer change.

## Shared Technical Requirements

- Projection: equirectangular / lat-long
- Resolution: `2048 x 1024`
- Aspect ratio: `2:1`
- Horizontal coverage: longitude `-180` to `+180`
- Vertical coverage: latitude `+90` to `-90`
- Seam position: International Date Line at the left/right edge
- File format:
  - prefer `PNG` for transparency support
  - `WebP` is acceptable for opaque full textures if compression matters
- Orientation:
  - north pole touches the top edge
  - south pole touches the bottom edge
  - Greenwich / western Europe should appear slightly right of center in the raw flat texture
- Safe design rule: avoid important visual features crossing the left/right seam

## Option 1: Land-Only Transparent Overlay

This option replaces only the land drawing while keeping ocean color and scene lighting controlled in code.

### Asset Spec

- Canvas size: `2048 x 1024`
- Background: fully transparent
- Land: opaque or semi-opaque stylized continents
- Ocean: transparent
- Borders:
  - optional
  - if included, keep them subtle and baked into the land layer
- Polar regions:
  - include land/ice shapes if desired
  - keep transparency outside actual visible landmass

### Visual Guidance

- Best when the renderer should keep control of ocean tone, night shading, and atmosphere
- Good fit for simplified, playful, educational, or storybook continents
- Land edges should be clean because transparency will reveal the renderer ocean directly
- Avoid anti-aliased halos that assume a specific ocean color

### Renderer Integration Notes

- Use this as the `map` for the Earth material over a solid ocean base
- Transparent areas should leave the underlying ocean visible
- This is the lowest-risk replacement for the current setup

## Option 2: Full Earth Texture

This option supplies a complete baked Earth surface including oceans and continents in one image.

### Asset Spec

- Canvas size: `2048 x 1024`
- Background: none; the full canvas is painted
- Land: fully painted
- Ocean: fully painted
- Borders:
  - optional
  - keep low contrast if the style is meant to stay clean
- Polar regions:
  - fully painted as part of the texture

### Visual Guidance

- Best when you want total artistic control over palette and surface style
- Good fit for painterly, toy-like, cel-shaded, illustrated, or fantasy-cartographic Earth looks
- Oceans can include gradients, currents, patterns, or decorative texture
- Continents can be stylized heavily as long as their approximate shapes remain readable

### Renderer Integration Notes

- This would replace both the current ocean fill and the generated land drawing
- Transparency is not required
- If a stronger day/night effect is desired, the lighting model must still provide that contrast on top of the baked texture

## Option 3: Paired Day/Night Stylized Textures

This option provides separate daytime and nighttime Earth textures for blending or switching in the renderer.

### Asset Spec

- Day texture:
  - `2048 x 1024`
  - equirectangular
  - fully painted
- Night texture:
  - `2048 x 1024`
  - equirectangular
  - same continent alignment as the day texture
- File format:
  - `PNG` preferred during iteration
  - final format can be optimized later
- Alignment rule:
  - landmasses must match exactly between day and night versions
  - no geographic drift between the two images

### Visual Guidance

- Day texture:
  - readable land/ocean palette
  - optional terrain, clouds, ice, decorative labels, or soft borders
- Night texture:
  - darker oceans and continents
  - optional city lights, aurora hints, glowing coastlines, moonlit water, or stylized illumination
- Keep the night texture intentionally darker so the terminator blend reads clearly

### Renderer Integration Notes

- This is the most flexible and highest-effort option
- Best if the Earth view should feel more cinematic or magical
- The renderer would need explicit day/night blending logic instead of a single map
- If city lights are included, they should be painted only into the night texture

## Recommendation

If the goal is to improve the current globe with minimal renderer disruption, choose:

- `Option 1` for the safest swap

If the goal is a fully custom stylized Earth look, choose:

- `Option 2`

If the goal is a premium day-night presentation with a more authored terminator experience, choose:

- `Option 3`

## Naming Suggestions

- Land-only:
  - `earth-land-overlay-2048x1024.png`
- Full texture:
  - `earth-surface-stylized-2048x1024.png`
- Day/night pair:
  - `earth-day-2048x1024.png`
  - `earth-night-2048x1024.png`
