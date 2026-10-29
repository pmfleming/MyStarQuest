"""Composite original supplied character images; never regenerate IP characters."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageOps, ImageChops
ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / 'src/assets/comic/references/sky-visitors'
OUT = ROOT / 'src/assets/comic/opening/36-aururo-welcome.webp'
canvas = Image.open(REF / 'terrace.png').convert('RGBA')
W,H = canvas.size
def cutout(name, height):
    im = Image.open(REF / name).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
# Retain the supplied silhouettes and faint volume, as figures standing in shade.
positions = [(770,545,255),(1010,550,250),(1260,560,270),(1490,560,310)]
for i,(cx,bottom,height) in enumerate(positions,1):
    im=cutout(f'mystery-{i}.png',height)
    x=cx-im.width//2
    y=bottom-height
    ground=Image.new('RGBA',canvas.size)
    ImageDraw.Draw(ground).ellipse((cx-im.width*.38,bottom-9,cx+im.width*.38,bottom+13),fill=(38,30,62,105))
    canvas=Image.alpha_composite(canvas,ground.filter(ImageFilter.GaussianBlur(7)))
    mask=Image.new('L',canvas.size)
    mask.paste(im.getchannel('A'),(x,y))
    rim=ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(3)),mask)
    rim=rim.point(lambda a:round(a*.38))
    edge=Image.new('RGBA',canvas.size,(164,151,197,0))
    edge.putalpha(rim)
    canvas=Image.alpha_composite(canvas,edge)
    shaded=ImageOps.colorize(ImageOps.grayscale(im),black=(25,23,37),white=(52,46,66)).convert('RGBA')
    shaded.putalpha(im.getchannel('A'))
    canvas.alpha_composite(shaded,(x,y))
# A little ankle-height mist leaves faces, bodies and outlines solid and readable.
mist=Image.new('RGBA',canvas.size)
d=ImageDraw.Draw(mist)
for cx,cy,rx,ry,a in [(770,544,110,13,25),(1010,550,105,13,25),(1260,560,115,14,25),(1490,560,100,14,25)]:
    d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(224,217,241,a))
canvas=Image.alpha_composite(canvas,mist.filter(ImageFilter.GaussianBlur(8)))
# Aururo's unaltered source art is the focus of this reverse-angle greeting.
im=cutout('aururo.png',650)
x,y=160,255
shadow=Image.new('RGBA',canvas.size)
ImageDraw.Draw(shadow).ellipse((x+90,855,x+im.width-40,910),fill=(90,62,116,65))
canvas=Image.alpha_composite(canvas,shadow.filter(ImageFilter.GaussianBlur(18)))
canvas.alpha_composite(im,(x,y))
canvas.convert('RGB').save(OUT,quality=93,method=6)
print(OUT)
