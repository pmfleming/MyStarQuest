"""Small playground groups, composited from existing character cutouts."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'src/assets'
BG=ASSET/'comic/references/playground-closeups'
OUT=ASSET/'comic/opening'
def character(path,height,angle=0):
    im=Image.open(ASSET/path).convert('RGBA')
    im=im.crop(im.getchannel('A').getbbox())
    im=im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
    if angle: im=im.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    return im
def compose(id,actors,bridge=False):
    bg=Image.open(BG/(id+'.png')).convert('RGBA')
    canvas=bg.copy()
    for path,cx,bottom,height,angle,shadow_y in actors:
        im=character(path,height,angle)
        if shadow_y:
            s=Image.new('RGBA',canvas.size)
            ImageDraw.Draw(s).ellipse((cx-height*.23,shadow_y-7,cx+height*.23,shadow_y+10),fill=(71,47,110,55))
            canvas=Image.alpha_composite(canvas,s.filter(ImageFilter.GaussianBlur(8)))
        canvas.alpha_composite(im,(round(cx-im.width/2),round(bottom-im.height)))
    if bridge:
        # Re-layer existing golden foreground net over feet, without repainting it.
        mask=Image.new('L',bg.size)
        p=bg.load(); m=mask.load()
        for y in range(450,653):
            for x in range(280,1210):
                r,g,b,a=p[x,y]
                if r>135 and g>65 and r>g*1.08 and g>b*1.25:
                    m[x,y]=255
        canvas=Image.composite(bg,canvas,mask)
    canvas.convert('RGB').save(OUT/(id+'.webp'),quality=93,method=6)
    print(id,canvas.size)
S='comic/references/sky-visitors/'
H='comic/references/helpers/'
compose('38-rainbow-slide',[
 (S+'aururo.png',510,575,330,-12,570),
 ('teenie/angel-odette-ping.png',1020,803,370,-10,800),
 (H+'coral.png',1110,370,180,8,None)])
compose('39-shell-swings',[
 ('teenie/eclipse.webp',575,760,390,-5,None),
 ('teenie/diana.webp',872,760,390,5,None),
 (H+'crystal.png',1130,410,180,-8,None)])
compose('40-rainbow-stepping-stones',[
 (S+'mystery-1.png',620,762,350,-8,767),
 (S+'mystery-2.png',950,690,310,0,695)])
compose('41-cloud-roundabout',[
 (S+'mystery-3.png',460,748,350,-5,751),
 (S+'mystery-4.png',1010,748,420,7,751)])
compose('42-cloud-trampolines',[
 (H+'yellow.png',365,510,285,-12,676),
 (H+'mint-curl.png',1090,423,280,12,676)])
compose('43-climbing-bridge',[
 (H+'lilac.png',440,610,210,0,None),
 (H+'mint.png',746,630,215,0,None),
 (H+'heart.png',1050,606,210,0,None)],bridge=True)
