"""Export the approved card artwork with real alpha, without baked-in UI.

Requires Pillow, numpy, scipy and rembg[cpu]. Reads original PNGs from the
integration manifest and writes the project WebP assets. The image generator
prepared the artwork; this step extracts backgrounds and verifies the exports.
"""
import argparse
import json
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('U2NET_HOME', str(ROOT / 'tmp/insect-bg-models'))
os.environ.setdefault('OMP_NUM_THREADS', '4')


def extract_white(source, semantic_mask):
    rgba = np.asarray(source.convert('RGBA')).copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    white = rgb.min(axis=2) >= 245
    labels, _ = ndi.label(white, structure=np.ones((3, 3)))
    exterior = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    exterior = exterior[exterior != 0]
    background = np.isin(labels, exterior)
    components = np.arange(1, labels.max() + 1)
    means = ndi.mean(semantic_mask, labels, components)
    background |= np.isin(labels, components[means < 100])
    distance = ndi.distance_transform_edt(~background)
    minimum = rgb.min(axis=2)
    local_minimum = ndi.minimum_filter(minimum, size=81)
    alpha = np.clip((255 - minimum) / np.maximum(255 - local_minimum, 120), 0, 1)
    t = np.clip(distance / 60, 0, 1)
    alpha += (1 - alpha) * t * t * (3 - 2 * t)
    alpha[background] = 0
    # Remove the white matte from soft fur, whiskers and foliage edges.
    rgb = 255 - (255 - rgb) / np.maximum(alpha[:, :, None], 0.001)
    rgba[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba)


def extract_map(source):
    rgba = np.asarray(source.convert('RGBA')).copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    # Cyan ocean is the backdrop. Keep cream land, highlighted terrain and snow.
    water = (blue - red > 25) & (green - red > 20) & (blue > green - 10)
    land = ~water
    alpha = np.clip(ndi.distance_transform_edt(land) - 0.5, 0, 1)
    rgba[:, :, 3] = np.round(alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--only', nargs='+')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'docs/assets/animal-card-integration.json').read_text())
    mask_dir = ROOT / 'tmp/animal-card-alpha-masks'
    mask_dir.mkdir(parents=True, exist_ok=True)
    qa_dir = ROOT / 'output/animal-card-review'
    qa_dir.mkdir(parents=True, exist_ok=True)
    session = None
    report = []
    for item in manifest['assets']:
        if args.only and item['name'] not in args.only:
            continue
        source = Image.open(item['source']).convert('RGB')
        source.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        if '/animal-locations/' in item['destination']:
            output = extract_map(source)
        else:
            mask_path = mask_dir / (item['name'] + '.png')
            if not mask_path.exists():
                if session is None:
                    session = new_session('u2net', providers=['CPUExecutionProvider'])
                remove(source, session=session).getchannel('A').save(mask_path)
            output = extract_white(source, np.asarray(Image.open(mask_path)))
        output.thumbnail((768, 768), Image.Resampling.LANCZOS)
        destination = ROOT / item['destination']
        output.save(destination, 'WEBP', quality=90, method=6)
        with Image.open(destination) as encoded:
            assert 'A' in encoded.getbands(), f'Missing alpha: {destination}'
            alpha = np.asarray(encoded.getchannel('A'))
            transparent = float((alpha == 0).mean())
            opaque = float((alpha > 200).mean())
            assert transparent > 0.1 and opaque > 0.025, f'Invalid cutout: {destination}'
            report.append({'name': item['name'], 'asset': item['destination'], 'transparentFraction': round(transparent, 3), 'opaqueFraction': round(opaque, 3), 'bytes': destination.stat().st_size})
        print(item['name'], flush=True)
    (qa_dir / 'transparency-checks.json').write_text(json.dumps(report, indent=2))
    for background, name in [('#fbcfe8', 'pink'), ('#17213b', 'dark')]:
        sheet = Image.new('RGB', (1250, 840), background)
        draw = ImageDraw.Draw(sheet)
        for i, item in enumerate(report):
            thumb = Image.open(ROOT / item['asset']).convert('RGBA')
            thumb.thumbnail((238, 240), Image.Resampling.LANCZOS)
            x, y = (i % 5) * 250 + 6, (i // 5) * 280
            sheet.paste(thumb, (x, y), thumb)
            draw.text((x + 4, y + 246), item['name'], fill='white' if name == 'dark' else '#831843')
        sheet.save(qa_dir / f'transparency-{name}.png')
    print(json.dumps({'verified': len(report), 'bytes': sum(row['bytes'] for row in report)}))


if __name__ == '__main__':
    main()
