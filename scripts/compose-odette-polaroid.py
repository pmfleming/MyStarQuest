"""Insert the unchanged birthday photograph into Odette's instant print."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'src/assets/comic/references/birthday'
OUT = ROOT / 'src/assets/comic/opening'
layout = json.loads((REF / 'polaroid-layout.json').read_text())
canvas = Image.open(REF / '58-odette-polaroid-base.png').convert('RGB')
assert canvas.size == (layout['canvas']['width'], layout['canvas']['height'])
photo = layout['photo']
group = Image.open(OUT / '57-birthday-group-photo-v2.webp').convert('RGB')
group = group.resize((photo['width'], photo['height']), Image.Resampling.LANCZOS)
canvas.paste(group, (photo['x'], photo['y']))
canvas.save(OUT / '58-odette-polaroid.webp', quality=95, method=6)
Image.open(REF / '58-odette-polaroid-base.png').convert('RGB').save(
    REF / '58-odette-polaroid-base.webp', quality=95, method=6)
print(OUT / '58-odette-polaroid.webp')
