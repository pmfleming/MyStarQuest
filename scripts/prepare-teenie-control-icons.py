"""Prepare the approved Teenieping edit/delete redraws without altering originals.

Pillow, NumPy and SciPy are required. Local background removal was authorized
by the user. The pencil already has alpha; only the bin's painted checkerboard
and handle opening need extraction. Production WebP export is handled by
prepare-teenie-theme.py.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
RECORDS = ROOT / 'docs/assets/teenie-theme-generation'


def main():
    entry = json.loads((RECORDS / 'control-delete.json').read_text())
    source = Image.open(entry['source']).convert('RGB')
    rgb = np.asarray(source).astype(float)
    neutral = (rgb.max(2) - rgb.min(2) < 7) & (rgb.min(2) > 218)
    labels, _ = ndi.label(neutral)
    ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1],
        [labels[round(source.height*.18), round(source.width*.5)]]]))
    background = np.isin(labels, ids[ids != 0])
    alpha = np.clip(ndi.distance_transform_edt(~background) / 2, 0, 1)
    rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(255 - (255-rgb)/np.maximum(alpha[:, :, None], .01), 0, 255)
    rgba[:, :, 3] = np.round(alpha*255)
    target = ROOT / 'output/teenie-theme/local-alpha/control-delete.png'
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(target)
    entry['originalSource'] = entry['source']
    entry['source'] = str(target)
    entry['localTransparency'] = {
        'authorization': 'User authorized local background removal in this task.',
        'method': 'Remove exterior neutral checkerboard and handle opening; narrow matte-corrected edge.',
        'script': 'scripts/prepare-teenie-control-icons.py',
    }
    (ROOT / 'docs/assets/teenie-theme-corrections/control-delete.json').write_text(json.dumps(entry, indent=2) + '\n')


if __name__ == '__main__':
    main()
