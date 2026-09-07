"""User-authorized local checkerboard removal; preserve generated masters.

Requires Pillow, numpy, scipy and rembg[cpu]. U2Net protects white subject
interiors; colour-connected background removal retains detached action props.
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


def matte(image, semantic, name):
    rgb = np.asarray(image.convert('RGB')).astype(np.float32)
    neutral = (rgb.max(2) - rgb.min(2) < 7) & (rgb.min(2) > 218)
    interior = ndi.binary_erosion(semantic > 230, iterations=5)
    candidates = neutral & ~interior
    labels, count = ndi.label(candidates)
    boundary = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    means = ndi.mean(semantic, labels, np.arange(1, count + 1))
    background_ids = np.union1d(boundary[boundary != 0], np.flatnonzero(means < 120) + 1)
    background = np.isin(labels, background_ids)
    # Reconnect pale ear interiors to their retained fur outlines. Restrict
    # this repair to the upper hood, away from hands, props and web gaps.
    yy, xx = np.indices(background.shape)
    hood = (yy < image.height * .5) & (xx < image.width * .7)
    if name == 'ability-egg-stalks':
        hood |= (xx < image.width * .5) & (yy > image.height * .6) & (yy < image.height * .85)
    if name == 'ability-wool':
        hood |= (xx < image.width * .5) & (yy > image.height * .5) & (yy < image.height * .85)
    radius = round(image.width * .025)
    padded = np.pad(background, radius + 1, constant_values=True)
    expanded = ndi.distance_transform_edt(padded) <= radius
    closed = (ndi.distance_transform_edt(expanded) > radius)[radius+1:-radius-1, radius+1:-radius-1]
    background[closed & hood & neutral & (semantic > 10)] = False
    if name == 'ability-look-out':
        # U2Net misses this nearly white upper ear. Protect its observed inner
        # contour, traced on the 600px reference preview; retain the original
        # generated RGB and existing fuzzy outer edge.
        ear = Image.new('L', image.size)
        ImageDraw.Draw(ear).polygon([(round(x*image.width/600), round(y*image.height/600)) for x, y in
            [(318,45),(330,26),(349,14),(374,13),(395,21),(411,38),(419,60),(418,79),(405,96),(366,83)]], fill=255)
        background[np.asarray(ear) > 0] = False
    distance = ndi.distance_transform_edt(~background)
    # A narrow feather removes the baked matte at antialiased edges, without
    # making the white hood or highlights translucent.
    alpha = np.clip(distance / 2, 0, 1)
    alpha[background] = 0
    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(255 - (255 - rgb) / np.maximum(alpha[:, :, None], .01), 0, 255)
    rgba[:, :, 3] = np.round(alpha * 255)
    if name == 'ability-glow':
        # The firefly aura has a baked checker beneath its yellow light.
        # Extract that light's chroma outside the solid character/prop core;
        # neutral checker colours then contribute no opacity to the aura.
        yy, xx = np.indices(alpha.shape)
        aura = (xx > image.width * .58) & (yy > image.height * .48) & (yy < image.height * .84) & (semantic < 245)
        chroma = rgb.max(2) - rgb.min(2)
        glow_alpha = np.clip(chroma / 100, 0, 1)
        glow_rgb = 255 - (rgb.max(2)[:, :, None] - rgb) / np.maximum(glow_alpha[:, :, None], .01)
        rgba[aura, :3] = np.clip(glow_rgb[aura], 0, 255)
        rgba[aura, 3] = np.round(glow_alpha[aura] * 255)
    return Image.fromarray(rgba)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', nargs='+')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'docs/assets/teenie-theme-artwork.json').read_text())
    entries = [e for e in manifest['assets'] if e.get('status') == 'needs-transparency-correction' or e.get('localTransparency')]
    if args.ids:
        entries = [e for e in entries if e['id'] in args.ids]
    dest = ROOT / 'output/teenie-theme/local-alpha'
    cache = ROOT / 'tmp/teenie-alpha-masks'
    dest.mkdir(parents=True, exist_ok=True)
    cache.mkdir(parents=True, exist_ok=True)
    session = None
    reviewed = []
    for entry in entries:
        source = entry.get('localTransparency', {}).get('source', entry['source'])
        picture = Image.open(source).convert('RGB')
        mask_path = cache / (entry['id'] + '.png')
        if not mask_path.exists():
            if session is None:
                session = new_session('u2net')
            remove(picture, session=session).getchannel('A').save(mask_path)
        result = matte(picture, np.asarray(Image.open(mask_path)), entry['id'])
        target = dest / (entry['id'] + '.png')
        result.save(target)
        entry.update(source=str(target), status='generated', localTransparency={
            'source': source,
            'authorization': 'User explicitly approved local background removal on 2026-09-07.',
            'method': 'U2Net-protected neutral checkerboard connected components, pale fur outline repair, narrow edge feather and white matte decontamination; chroma extraction for the firefly glow.',
            'script': 'scripts/remove-teenie-backgrounds.py',
        })
        record = ROOT / 'docs/assets/teenie-theme-corrections' / (entry['id'] + '.json')
        record.write_text(json.dumps(entry, indent=2) + '\n')
        reviewed.append((entry['id'], result))
        print(entry['id'], flush=True)
    for page in range((len(reviewed) + 11) // 12):
        chunk = reviewed[page * 12:(page + 1) * 12]
        sheet = Image.new('RGB', (1200, ((len(chunk)+3)//4)*290))
        draw = ImageDraw.Draw(sheet)
        for index, (name, picture) in enumerate(chunk):
            x, y = (index % 4)*300, (index//4)*290
            draw.rectangle((x, y, x+149, y+289), fill='#302744')
            draw.rectangle((x+150, y, x+299, y+289), fill='#F5F0FF')
            picture.thumbnail((286, 260))
            sheet.paste(picture, (x+(300-picture.width)//2, y), picture)
            draw.text((x+5, y+270), name, fill='#c77db7')
        sheet.save(dest.parent / f'local-review-{page+1}.jpg', quality=95)


if __name__ == '__main__':
    main()
