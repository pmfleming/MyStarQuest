"""Remove the generated plate's exterior matte and align it with portion masks.

Uses the user's existing authorization for local background removal. Original
masters and the original SVG are retained. Requires Pillow, NumPy and SciPy.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
record = ROOT / 'docs/assets/teenie-theme-generation/control-plate.json'
entry = json.loads(record.read_text())
picture = Image.open(entry['source']).convert('RGB')
rgb = np.asarray(picture).astype(float)
neutral = (rgb.max(2) - rgb.min(2) < 8) & (rgb.min(2) > 215)
labels, _ = ndi.label(neutral)
outside = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
background = np.isin(labels, outside[outside != 0])
alpha = np.clip(ndi.distance_transform_edt(~background) / 2, 0, 1)
rgba = np.zeros((*alpha.shape, 4), dtype=np.uint8)
rgba[:, :, :3] = np.clip(255 - (255-rgb)/np.maximum(alpha[:, :, None], .01), 0, 255)
rgba[:, :, 3] = np.round(alpha*255)
result = Image.fromarray(rgba)
# Use the whole circular artwork within the app's square plate texture. This
# also corrects the small generated horizontal/vertical diameter difference.
bounds = result.getchannel('A').getbbox()
result = result.crop(bounds).resize((1024, 1024), Image.Resampling.LANCZOS)
target = ROOT / 'output/teenie-theme/local-alpha/control-plate.png'
target.parent.mkdir(parents=True, exist_ok=True)
result.save(target)
entry.update(originalSource=entry['source'], source=str(target), status='generated', localTransparency={
    'authorization': 'User authorized local background removal in this task.',
    'method': 'Exterior neutral connected components; preserve opaque plate centre; narrow matte-corrected edges; align circular bounds to square texture.',
    'script': 'scripts/prepare-teenie-plate.py',
})
(ROOT / 'docs/assets/teenie-theme-corrections/control-plate.json').write_text(json.dumps(entry, indent=2) + '\n')
