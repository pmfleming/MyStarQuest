"""Reveal the playground using original supplied character overlays."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
REF=ROOT/'src/assets/comic/references/sky-visitors'
OUT=ROOT/'src/assets/comic/opening/37-playground-surprise.webp'
canvas=Image.open(REF/'playground.png').convert('RGBA')
def place(name,cx,bottom,height):
    global canvas
    im=Image.open(REF/name).convert('RGBA')
    im=im.crop(im.getchannel('A').getbbox())
    im=im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
    shadow=Image.new('RGBA',canvas.size)
    ImageDraw.Draw(shadow).ellipse((cx-im.width*.34,bottom-10,cx+im.width*.34,bottom+12),fill=(76,50,105,62))
    canvas=Image.alpha_composite(canvas,shadow.filter(ImageFilter.GaussianBlur(9)))
    canvas.alpha_composite(im,(cx-im.width//2,bottom-height))
# Original colours and original poses reveal that these are friendly visitors.
for name,cx,bottom,height in [('mystery-1.png',650,878,235),('mystery-2.png',900,881,230),('mystery-3.png',1180,887,255),('mystery-4.png',1450,885,315)]:
    place(name,cx,bottom,height)
place('aururo.png',338,906,355)
canvas.convert('RGB').save(OUT,quality=93,method=6)
print(OUT)
