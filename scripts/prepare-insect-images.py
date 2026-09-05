"""Remove the original white matte, export WebP, and create QA contact sheets.

Requires Pillow, numpy, scipy, and rembg[cpu]. The user authorised local
background removal. Originals are never modified. U2Net only identifies
enclosed background gaps; it must not discard detached notes or action props.
"""
import os
import json
import argparse
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from rembg import new_session, remove


def remove_white_matte(source, semantic_mask, white_threshold=245):
    rgba = np.asarray(source.convert('RGBA')).copy()
    rgb = rgba[:, :, :3].astype(np.float32)
    white = rgb.min(axis=2) >= white_threshold
    labels, _ = ndi.label(white, structure=np.ones((3, 3)))
    exterior = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    exterior = exterior[exterior != 0]
    background = np.isin(labels, exterior)
    # Keep enclosed eye highlights and pale wings; remove gaps between limbs.
    components = np.arange(1, labels.max()+1)
    means = ndi.mean(semantic_mask, labels, components)
    background |= np.isin(labels, components[means < 100])
    distance = ndi.distance_transform_edt(~background)
    minimum = rgb.min(axis=2)
    local_minimum = ndi.minimum_filter(minimum, size=81)
    alpha = np.clip((255-minimum) / np.maximum(255-local_minimum, 120), 0, 1)
    t = np.clip(distance / 60, 0, 1)
    alpha += (1-alpha) * t*t*(3-2*t)
    alpha[background] = 0
    # Undo the white matte at soft edges instead of leaving a white halo.
    rgb = 255 - (255-rgb) / np.maximum(alpha[:, :, None], 0.001)
    rgba[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.round(alpha*255).astype(np.uint8)
    return Image.fromarray(rgba)

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', nargs='+', choices=['portraits', 'abilities', 'facts', 'generic'])
parser.add_argument('--ids', nargs='+', help='Prepare only these manifest asset IDs')
args = parser.parse_args()
manifest = json.loads((root / 'docs/assets/insect-image-outputs.json').read_text())
destination = root / 'src/assets/insects'
os.environ.setdefault('U2NET_HOME', str(root / 'tmp/insect-bg-models'))
mask_cache = root / 'tmp/insect-masks'
mask_cache.mkdir(parents=True, exist_ok=True)
session = None
for entry in manifest:
    folder = entry['id'].split('/')[0]
    if args.ids and entry['id'] not in args.ids:
        continue
    if args.only and folder not in args.only:
        continue
    target = destination / (entry['id'] + '.webp')
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(entry['source']) as source:
        source.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        if 'A' in source.getbands() and source.getchannel('A').getextrema()[0] == 0:
            output = source.convert('RGBA')
        else:
            mask_path = mask_cache / (entry['id'].replace('/', '-') + '.png')
            if not mask_path.exists():
                if session is None:
                    session = new_session('u2net')
                remove(source, session=session).getchannel('A').save(mask_path)
            with Image.open(mask_path) as mask:
                # Include both pale checker colours in the background regions;
                # the semantic mask still protects enclosed eye highlights.
                threshold = 225 if entry.get('background') == 'checkerboard' else 245
                output = remove_white_matte(source, np.asarray(mask), threshold)
        size = entry.get('size', 384 if folder in ('facts', 'generic') else 448)
        output.thumbnail((size, size), Image.Resampling.LANCZOS)
        # 32 alpha levels preserve smooth card-size edges without a large,
        # noisy lossless alpha plane. Endpoints stay exactly 0 and 255.
        alpha = np.asarray(output.getchannel('A')).astype(np.float32)
        alpha = np.round(np.round(alpha*31/255)*255/31).astype(np.uint8)
        output.putalpha(Image.fromarray(alpha))
        temporary = target.with_suffix('.webp.tmp')
        output.save(temporary, 'WEBP', quality=entry.get('quality', 75), method=6)
        temporary.replace(target)
    print(entry['id'], flush=True)

for file in destination.rglob('*.webp'):
    with Image.open(file) as image:
        if 'A' not in image.getbands() or image.getchannel('A').getextrema()[0] != 0:
            raise ValueError(f'Transparency was lost in WebP: {file}')
        alpha = np.asarray(image.getchannel('A'))
        if (alpha == 0).mean() < 0.1 or (alpha > 200).mean() < 0.01:
            raise ValueError(f'Unexpected empty subject or opaque background: {file}')

qa = root / 'tmp/insect-qa'
qa.mkdir(parents=True, exist_ok=True)
ordered = sorted(destination.rglob('*.webp'))
for offset in range(0, len(ordered), 12):
    sheet = Image.new('RGB', (1000, 840), '#f4c9e3')
    draw = ImageDraw.Draw(sheet)
    for index, file in enumerate(ordered[offset:offset+12]):
        x, y = (index % 4) * 250, (index // 4) * 280
        with Image.open(file) as source:
            source.thumbnail((240, 245))
            sheet.paste(source, (x, y), source if source.mode == 'RGBA' else None)
        draw.text((x+5, y+247), str(file.relative_to(destination)), fill='black')
    sheet.save(qa / f'contact-{offset//12+1}.jpg')
print(f'Prepared {len(ordered)} images; QA sheets: {qa}')
