"""Remove the standing toilet illustration's exterior matte, as authorized by the user."""
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


def main():
    record = ROOT / 'docs/assets/teenie-theme-corrections/notpeepee.json'
    entry = json.loads(record.read_text(encoding='utf-8'))
    source = entry.get('originalSource', entry['source'])
    picture = Image.open(source).convert('RGB')
    rgb = np.asarray(picture).astype(float)
    mask_path = ROOT / 'tmp/teenie-alpha-masks/notpeepee-pose.png'
    mask_path.parent.mkdir(parents=True, exist_ok=True)
    if not mask_path.exists():
        remove(picture, session=new_session('u2net')).getchannel('A').save(mask_path)
    semantic = np.asarray(Image.open(mask_path))
    interior = ndi.binary_erosion(semantic > 230, iterations=5)
    # Pale bow and belt details missed by segmentation, traced on the 1254px master.
    detail_mask = Image.new('L', picture.size)
    draw = ImageDraw.Draw(detail_mask)
    sx, sy = picture.width / 1254, picture.height / 1254
    draw.ellipse((908*sx, 592*sy, 1030*sx, 707*sy), fill=255)
    draw.ellipse((992*sx, 682*sy, 1037*sx, 767*sy), fill=255)
    draw.polygon([(x*sx, y*sy) for x, y in [(674, 923), (714, 911), (752, 918), (770, 935), (777, 956), (766, 970), (740, 958), (720, 957), (699, 976), (676, 960)]], fill=255)
    interior |= np.asarray(detail_mask) > 0
    neutral = (rgb.max(2) - rgb.min(2) < 10) & (rgb.min(2) > 218)
    labels, _ = ndi.label(neutral & ~interior)
    ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    background = np.isin(labels, ids[ids != 0])
    alpha = np.clip(ndi.distance_transform_edt(~background) / 2, 0, 1)
    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(255 - (255 - rgb) / np.maximum(alpha[:, :, None], .01), 0, 255)
    rgba[:, :, 3] = np.round(alpha * 255)
    target = ROOT / 'output/teenie-theme/local-alpha/notpeepee-pose.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(target)
    entry.update(originalSource=source, source=str(target), status='generated')
    entry['localTransparency'] = {
        'authorization': 'User authorized local background removal in this task.',
        'method': 'Protect white clothing and hair decorations with U2Net segmentation before removing edge-connected neutral checkerboard; apply narrow matte-corrected edge.',
        'script': 'scripts/prepare-teenie-toilet.py',
    }
    record.write_text(json.dumps(entry, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
