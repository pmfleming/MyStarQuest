"""Export scenic location illustrations, preserving the soft world-map backdrop.

Requires Pillow, numpy and scipy. Optional --only keys limits re-exports.
Sources and generation prompts live in docs/assets/scenic-location-images.json.
"""
import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', nargs='+')
parser.add_argument('--size', type=int, default=512)
parser.add_argument('--quality', type=int, default=76)
args = parser.parse_args()
manifest = json.loads((ROOT / 'docs/assets/scenic-location-images.json').read_text())
checks = []

for item in manifest['assets']:
    if not item.get('source') or (args.only and item['key'] not in args.only):
        continue
    source = Image.open(item['source'])
    has_alpha = 'A' in source.getbands() and source.getchannel('A').getextrema()[0] < 255
    source = source.convert('RGBA')
    source.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
    if not has_alpha:
        rgba = np.asarray(source).copy()
        rgb = rgba[:, :, :3].astype(float)
        minimum = rgb.min(axis=2)
        neutral = (rgb.max(axis=2) - minimum < 15) & (minimum > 205)
        edge = np.zeros_like(neutral)
        edge[0] = neutral[0]
        edge[-1] = neutral[-1]
        edge[:, 0] = neutral[:, 0]
        edge[:, -1] = neutral[:, -1]
        background = ndi.binary_propagation(edge, mask=neutral)
        distance = ndi.distance_transform_edt(~background)
        # Feather only the exterior matte; retain the pale world map, blue
        # ocean backdrop, snow and clouds inside the illustration.
        alpha = np.clip((255 - minimum) / 130, 0, 1)
        t = np.clip(distance / 50, 0, 1)
        alpha += (1 - alpha) * t * t * (3 - 2 * t)
        alpha[background] = 0
        rgb = 255 - (255 - rgb) / np.maximum(alpha[:, :, None], .001)
        rgba[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
        rgba[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
        source = Image.fromarray(rgba)
    artwork = ImageOps.contain(source, (args.size, args.size), Image.Resampling.LANCZOS)
    output = Image.new('RGBA', (args.size, args.size))
    output.paste(artwork, ((args.size - artwork.width) // 2, (args.size - artwork.height) // 2))
    destination = ROOT / item['destination']
    destination.parent.mkdir(parents=True, exist_ok=True)
    output.save(destination, 'WEBP', quality=args.quality, method=6)
    alpha = np.asarray(Image.open(destination).getchannel('A'))
    transparent = float((alpha == 0).mean())
    assert transparent > .005 and (alpha > 200).mean() > .15, item['key']
    checks.append({'key': item['key'], 'alpha': True, 'backgroundExtracted': not has_alpha,
                   'transparentFraction': round(transparent, 4), 'bytes': destination.stat().st_size})
    print(item['key'], flush=True)

review = ROOT / 'output/scenic-location-review'
review.mkdir(parents=True, exist_ok=True)
assets = [item for item in manifest['assets'] if (ROOT / item['destination']).exists()]
for color, name in [('#fce7f3', 'pink'), ('#14213a', 'dark')]:
    sheet = Image.new('RGB', (1250, ((len(assets) + 4) // 5) * 265), color)
    draw = ImageDraw.Draw(sheet)
    for i, item in enumerate(assets):
        thumb = Image.open(ROOT / item['destination']).convert('RGBA')
        thumb.thumbnail((240, 240), Image.Resampling.LANCZOS)
        x, y = (i % 5) * 250 + 5, (i // 5) * 265
        sheet.paste(thumb, (x, y), thumb)
        draw.text((x + 25, y + 242), item['label'], fill='white' if name == 'dark' else '#831843')
    sheet.save(review / f'gallery-{name}.png')
(review / 'alpha-checks.json').write_text(json.dumps(checks, indent=2))
print(json.dumps({'exported': len(checks), 'bytes': sum(row['bytes'] for row in checks)}))
