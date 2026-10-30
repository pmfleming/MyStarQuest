"""Original guest artwork posing for the birthday group photograph."""
from pathlib import Path
import argparse
from PIL import Image, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'src/assets/comic/references/birthday'
parser = argparse.ArgumentParser()
parser.add_argument('--revision', default='')
revision = parser.parse_args().revision
suffix = '-' + revision if revision else ''
canvas = Image.open(REF/('57-group-photo-base'+suffix+'.png')).convert('RGBA')
placements = [
    ('waddle-dee-cutout.png',165,925,180),
    ('bandana-waddle-dee-cutout.png',470,927,190),
    ('magolor-cutout.png',1175,917,190),
    ('lalala-lololo-cutout.png',1460,930,175),
    ('meta-knight-original.png',835,930,275),
]
for filename,cx,bottom,height in placements:
    im = Image.open(REF/filename).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    im = im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
    shadow = Image.new('RGBA',canvas.size)
    ImageDraw.Draw(shadow).ellipse((cx-im.width*.32,bottom-12,cx+im.width*.32,bottom+2),fill=(71,37,91,70))
    canvas = Image.alpha_composite(canvas,shadow.filter(ImageFilter.GaussianBlur(8)))
    canvas.alpha_composite(im,(cx-im.width//2,bottom-height))
output = ROOT/('src/assets/comic/opening/57-birthday-group-photo'+suffix+'.webp')
canvas.convert('RGB').save(output,'WEBP',quality=94,method=6)
print(output)
