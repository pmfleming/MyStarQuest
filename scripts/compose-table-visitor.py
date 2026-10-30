"""Place the user's original cloaked character on the castle table."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'src/assets/comic/references/table-visitor'
canvas = Image.open(REF / 'empty-table.png').convert('RGBA')
visitor = Image.open(REF / 'original-character.png').convert('RGBA')
# The latest attachment has a flattened black background. Reuse the exact
# silhouette from the earlier transparent copy of this same artwork.
matte = Image.open(REF / 'transparent-reference.png').convert('RGBA')
if matte.size != visitor.size:
    raise ValueError('Character and transparency reference dimensions differ')
visitor.putalpha(matte.getchannel('A'))
visitor = visitor.crop(visitor.getchannel('A').getbbox())
height = 410
visitor = visitor.resize((round(visitor.width * height / visitor.height), height), Image.Resampling.LANCZOS)
cx, bottom = 930, 597
shadow = Image.new('RGBA', canvas.size)
ImageDraw.Draw(shadow).ellipse((cx - visitor.width * .47, bottom - 17, cx + visitor.width * .47, bottom + 10), fill=(5, 3, 18, 155))
canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(10)))
canvas.alpha_composite(visitor, (cx - visitor.width // 2, bottom - height))
output = ROOT / 'src/assets/comic/opening/53-cloaked-visitor-on-table.webp'
canvas.convert('RGB').save(output, 'WEBP', quality=94, method=6)
print(output)
