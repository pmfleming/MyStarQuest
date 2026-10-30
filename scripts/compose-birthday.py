"""Keep supplied party guests as original cutout overlays."""
from pathlib import Path
import argparse
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'src/assets/comic/references/birthday'
OUT = ROOT / 'src/assets/comic/opening'
parser = argparse.ArgumentParser()
parser.add_argument('--revision', default='')
revision = parser.parse_args().revision
suffix = '-' + revision if revision else ''

def cutout(name):
    im = Image.open(REF / (name + '-original.png')).convert('RGBA')
    if im.getchannel('A').getextrema() == (255, 255):
        # Remove only edge-connected white backdrop; preserve white eye highlights.
        px = im.load(); w, h = im.size
        seen = set(); queue = deque()
        def background(x, y):
            r, g, b, _ = px[x,y]
            return min(r,g,b) > 243 or (y > h*.89 and max(r,g,b)-min(r,g,b) < 12 and min(r,g,b) > 90)
        for x in range(w):
            queue.extend([(x,0),(x,h-1)])
        for y in range(h):
            queue.extend([(0,y),(w-1,y)])
        while queue:
            x,y = queue.popleft()
            if (x,y) in seen: continue
            seen.add((x,y))
            if not background(x,y): continue
            r,g,b,_ = px[x,y]; px[x,y]=(r,g,b,0)
            for a,b in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if 0 <= a < w and 0 <= b < h and (a,b) not in seen: queue.append((a,b))
    im = im.crop(im.getchannel('A').getbbox())
    im.save(REF / (name+'-cutout.png'))
    return im

guests = {n:cutout(n) for n in ['waddle-dee','bandana-waddle-dee','magolor','lalala-lololo']}
layouts = {
 '54-birthday-surprise': [('waddle-dee',235,908,185),('bandana-waddle-dee',605,906,195),('magolor',1000,890,205),('lalala-lololo',1400,921,175)],
 '55-birthday-cake': [('bandana-waddle-dee',260,920,205),('magolor',635,908,205),('waddle-dee',1020,917,195),('lalala-lololo',1420,921,190)],
 '56-birthday-dancing': [('magolor',230,893,205),('lalala-lololo',650,922,195),('bandana-waddle-dee',1100,918,200),('waddle-dee',1450,914,190)],
}
for name, placements in layouts.items():
    canvas = Image.open(REF / (name+'-base'+suffix+'.png')).convert('RGBA')
    for guest,cx,bottom,height in placements:
        im = guests[guest]
        im = im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
        shadow = Image.new('RGBA',canvas.size)
        ground = bottom+8 if guest == 'magolor' else bottom-2
        ImageDraw.Draw(shadow).ellipse((cx-im.width*.34,ground-9,cx+im.width*.34,ground+9),fill=(72,37,91,62))
        canvas = Image.alpha_composite(canvas,shadow.filter(ImageFilter.GaussianBlur(9)))
        canvas.alpha_composite(im,(cx-im.width//2,bottom-height))
    canvas.convert('RGB').save(OUT/(name+suffix+'.webp'),'WEBP',quality=94,method=6)
    print(name,canvas.size)
