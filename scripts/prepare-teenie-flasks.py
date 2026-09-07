"""Remove exterior flask checkerboards with the user's local-edit authorization."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]


def main():
    for level in ['full', 'twothirds', 'onethird']:
        filename = f'control-flask-{level}.json'
        entry = json.loads((ROOT / 'docs/assets/teenie-theme-generation' / filename).read_text(encoding='utf-8'))
        rgb = np.asarray(Image.open(entry['source']).convert('RGB')).astype(float)
        neutral = (rgb.max(2) - rgb.min(2) < 10) & (rgb.min(2) > 218)
        labels, _ = ndi.label(neutral)
        ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
        background = np.isin(labels, ids[ids != 0])
        alpha = np.clip(ndi.distance_transform_edt(~background) / 2, 0, 1)
        rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
        rgba[:, :, :3] = np.clip(255 - (255 - rgb) / np.maximum(alpha[:, :, None], .01), 0, 255)
        rgba[:, :, 3] = np.round(alpha * 255)
        target = ROOT / f'output/teenie-theme/local-alpha/flask-{level}.png'
        target.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(rgba).save(target)
        entry['originalSource'] = entry['source']
        entry['source'] = str(target)
        entry['localTransparency'] = {
            'authorization': 'User authorized local background removal in this task.',
            'method': 'Remove only edge-connected neutral checkerboard, preserving opaque bottle interior and water; narrow matte-corrected edge.',
            'script': 'scripts/prepare-teenie-flasks.py',
        }
        (ROOT / 'docs/assets/teenie-theme-corrections' / filename).write_text(json.dumps(entry, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
