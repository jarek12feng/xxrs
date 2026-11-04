from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import shutil,json,hashlib
root=Path('/Users/admin/Documents/ChatGPT/xxrs')
d=root/'docs/art-candidates/nascent-tribulation-20261104'
out=root/'public/art/nascent-tribulation'
src=Path('/Users/admin/.codex/generated_images/01a1a5b5-69a0-70c3-9434-d691cd24a015')
items=[('tribulation-platform-v1','exec-da76aaca-35dd-4951-99fe-28be227be794.png',(1920,1080)),('tribulation-cleared-v1','exec-3a799269-53d8-4a46-a92a-3406a7829f6f.png',(1920,1080)),('lightning-strike-v1','exec-1b1b01f0-124e-4e0a-863e-44898c6b52e4.png',(768,1536)),('lightning-impact-v1','exec-9395c841-6341-4dae-91cd-9efd7e12dabe.png',(1536,768)),('tribulation-ward-v1','exec-5c918183-9b52-4202-9f5a-b93b1f7a06fc.png',(1024,1024))]
shutil.copy2(src/'exec-2eec14ce-b381-446e-acee-692188af33f5.png',d/'originals/tribulation-ward-rejected-edge.png')
meta=[]
for name,file,size in items:
 im=Image.open(src/file); shutil.copy2(src/file,d/'originals'/f'{name}.png'); original_size=im.size
 if im.mode=='RGBA':
  fitted=ImageOps.contain(im,(size[0]-32,size[1]-32),Image.Resampling.LANCZOS); exp=Image.new('RGBA',size); exp.alpha_composite(fitted,((size[0]-fitted.width)//2,(size[1]-fitted.height)//2))
  exp.save(out/f'{name}.webp',lossless=True,method=6)
 else:
  exp=ImageOps.fit(im,size,Image.Resampling.LANCZOS);exp.save(out/f'{name}.webp',quality=94,method=6)
 check=Image.open(out/f'{name}.webp').convert('RGBA');a=check.getchannel('A');hist=a.histogram(); edges=[a.crop((0,0,size[0],1)),a.crop((0,size[1]-1,size[0],size[1])),a.crop((0,0,1,size[1])),a.crop((size[0]-1,0,size[0],size[1]))]
 meta.append(dict(file=str(out/f'{name}.webp'),original=str(d/'originals'/f'{name}.png'),originalSize=original_size,exportSize=size,alphaExtrema=a.getextrema(),transparentPixels=hist[0],partialAlphaPixels=sum(hist[1:255]),outerEdgeMaxAlpha=max(x.getextrema()[1] for x in edges),alphaBounds=a.getbbox(),sha256=hashlib.sha256((out/f'{name}.webp').read_bytes()).hexdigest()))
 if im.mode=='RGB':
  for w in [480,1280]: check.convert('RGB').resize((w,round(w*9/16)),Image.Resampling.LANCZOS).save(d/'QA'/f'{name}-{w}.png')
 else:
  for w in [96,384]:
   thumb=check.resize((w,round(w*size[1]/size[0])),Image.Resampling.LANCZOS)
   sheet=Image.new('RGB',(w*2,thumb.height),(23,30,40));sheet.paste((224,222,213),(w,0,w*2,thumb.height));sheet.paste(thumb,(0,0),thumb);sheet.paste(thumb,(w,0),thumb);sheet.save(d/'QA'/f'{name}-{w}-dark-light.png')
(d/'QA/metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
# Review sheet with target thumbnails only, no artistic modification.
sheet=Image.new('RGB',(1200,1080),'#25303b');draw=ImageDraw.Draw(sheet)
for i,n in enumerate(['tribulation-platform-v1','tribulation-cleared-v1']):
 im=Image.open(d/'QA'/f'{n}-480.png');sheet.paste(im,(i*600,25));draw.text((i*600,5),n,fill='white')
for i,n in enumerate(['lightning-strike-v1','lightning-impact-v1','tribulation-ward-v1']):
 im=Image.open(d/'QA'/f'{n}-384-dark-light.png');im.thumbnail((390,740));sheet.paste(im,(i*400,330));draw.text((i*400,310),n,fill='white')
sheet.save(d/'QA/contact-sheet.jpg')
print(json.dumps(meta,indent=2))
