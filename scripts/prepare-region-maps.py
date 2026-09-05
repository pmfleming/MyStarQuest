"""Export generated region maps as padded, transparent WebP card artwork.

Requires Pillow and numpy. Original images and prompts are recorded in
docs/assets/region-map-prompts.json. No captions or card frames are baked in.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'docs/assets/region-map-prompts.json').read_text())
checks = []
sheet = Image.new('RGB', (1280, 700), '#fbcfe8')
draw = ImageDraw.Draw(sheet)
for index, item in enumerate(manifest['assets']):
    source = Image.open(item['source'])
    extracted = 'A' not in source.getbands()
    source = source.convert('RGBA')
    if extracted:
        # Some generator outputs paint a neutral grey checkerboard. The map
        # uses saturated cream/green land, so remove only neutral bright pixels.
        rgba = np.asarray(source).copy()
        rgb = rgba[:, :, :3].astype(float)
        chroma = rgb.max(axis=2) - rgb.min(axis=2)
        alpha = np.where(rgb.min(axis=2) > 190, np.clip((chroma - 5) / 10, 0, 1), 1)
        rgba[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
        source = Image.fromarray(rgba)
    artwork = ImageOps.contain(source, (704, 650), Image.Resampling.LANCZOS)
    card = Image.new('RGBA', (768, 768))
    card.paste(artwork, ((768 - artwork.width) // 2, (768 - artwork.height) // 2))
    destination = ROOT / item['destination']
    card.save(destination, 'WEBP', quality=85, method=6)
    encoded = Image.open(destination).convert('RGBA')
    alpha = np.asarray(encoded.getchannel('A'))
    transparent = float((alpha == 0).mean())
    assert transparent > .2 and (alpha > 200).mean() > .05, item['key']
    checks.append({'key': item['key'], 'alpha': True, 'backgroundExtracted': extracted,
                   'transparentFraction': round(transparent, 3), 'bytes': destination.stat().st_size})
    thumb = encoded.resize((300, 300), Image.Resampling.LANCZOS)
    x, y = (index % 4) * 320 + 10, (index // 4) * 350
    sheet.paste(thumb, (x, y), thumb)
    draw.text((x + 90, y + 306), item['label'], fill='#831843')
review = ROOT / 'output/animal-region-review'
review.mkdir(parents=True, exist_ok=True)
sheet.save(review / 'maps.png')
(ROOT / 'docs/assets/region-map-alpha-checks.json').write_text(json.dumps(checks, indent=2))
print(json.dumps(checks, indent=2))
