"""Dress-up composites reuse original faces, Dingdong's suit and equipment."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'src/assets'
REF=A/'comic/references/space-trip'
def rgba(path): return Image.open(A/path).convert('RGBA')
ding=rgba('teenie/dingdong.webp')
# Existing jetpack prop, isolated with a polygon from the original accessory sheet.
prop=rgba('teenie/prop/dingdong.webp')
pm=Image.new('L',prop.size)
ImageDraw.Draw(pm).polygon([(650,968),(700,901),(860,911),(933,835),(973,733),(1040,703),(1101,748),(1135,799),(1227,847),(1253,1113),(1036,1174),(773,1253),(627,1161)],fill=255)
from PIL import ImageChops
prop.putalpha(ImageChops.multiply(prop.getchannel('A'),pm))
pack=prop.crop(prop.getchannel('A').getbbox())
def suit(name,path,box):
    body=ding.copy()
    face=rgba(path).crop(box)
    face=ImageOps.fit(face,(760,586),method=Image.Resampling.LANCZOS)
    mask=Image.new('L',face.size)
    ImageDraw.Draw(mask).ellipse((2,2,758,584),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(3))
    face.putalpha(mask)
    body.alpha_composite(face,(164,443))
    # Original helmet rim and visor sit in front of the replacement face.
    # A gentle clear visor highlight makes the enclosing helmet easy to read.
    visor=Image.new('RGBA',body.size)
    d=ImageDraw.Draw(visor)
    d.arc((150,418,945,1042),195,245,fill=(255,255,255,95),width=9)
    body=Image.alpha_composite(body,visor)
    out=Image.new('RGBA',(1320,1500))
    p=pack.resize((790,round(pack.height*790/pack.width)),Image.Resampling.LANCZOS)
    out.alpha_composite(p,(0,720))
    out.alpha_composite(body,(210,10))
    out.save(REF/(name+'-spacesuit.png'))
    return out
suit('odette','teenie/angel-odette-ping.png',(421,146,895,532))
suit('aurora','comic/references/sky-visitors/aururo.png',(164,230,819,743))
suit('eclipse','teenie/eclipse.webp',(382,484,889,879))
def fit(im,height):
    im=im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
def scene(file,actors):
    canvas=Image.open(REF/'terrace.png').convert('RGBA')
    for path,cx,bottom,height in actors:
        im=fit(rgba(path),height)
        s=Image.new('RGBA',canvas.size)
        ImageDraw.Draw(s).ellipse((cx-height*.22,bottom-4,cx+height*.22,bottom+14),fill=(70,45,104,55))
        canvas=Image.alpha_composite(canvas,s.filter(ImageFilter.GaussianBlur(9)))
        canvas.alpha_composite(im,(round(cx-im.width/2),bottom-height))
    canvas.convert('RGB').save(A/'comic/opening'/file,quality=93,method=6)
scene('44-dingdong-invitation.webp',[
 ('teenie/dingdong.webp',335,830,410),
 ('teenie/angel-odette-ping.png',770,876,400),
 ('comic/references/sky-visitors/aururo.png',1100,870,400),
 ('teenie/eclipse.webp',1430,870,440)])
scene('45-ready-for-space.webp',[
 ('teenie/dingdong.webp',230,865,460),
 ('comic/references/space-trip/odette-spacesuit.png',620,880,490),
 ('comic/references/space-trip/aurora-spacesuit.png',1010,880,490),
 ('comic/references/space-trip/eclipse-spacesuit.png',1400,880,490)])
