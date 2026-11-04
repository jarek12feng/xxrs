const fs=require('fs');const path=require('path');
const sharp=require('/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const cache='/Users/admin/.codex/generated_images/01a19b12-32f0-7272-abd0-bb8e2f202471';
const assets=[['sect-medicine-court','exec-0447a41e-bf36-4c69-a2c9-ed23cb96cf67.png'],['stone-ravine-vault','exec-c75ef244-3455-4f50-8457-03ce6ac8b6b4.png'],['broken-stele-inn','exec-c6e0c147-00b6-490f-9788-000505c08a0a.png']];
(async()=>{const manifest=[];for(const [name,file] of assets){
const orig=path.join(root,'originals',name+'.png');if(!fs.existsSync(orig))fs.copyFileSync(path.join(cache,file),orig);
const meta=await sharp(orig).metadata();
const dest=path.join(root,'exports',name+'.webp');await sharp(orig).resize(1920,1080,{fit:'cover',position:'centre'}).webp({quality:88,effort:6}).toFile(dest);
for(const [w,h] of [[1920,1080],[1280,720]])await sharp(dest).resize(w,h,{fit:'cover',position:'centre'}).png().toFile(path.join(root,'QA',`${name}-${w}x${h}.png`));
manifest.push({name,status:'candidate',tool:'image_gen built-in',date:'2026-11-04',sourceCache:path.join(cache,file),original:orig,originalWidth:meta.width,originalHeight:meta.height,requestedWidth:1920,requestedHeight:1080,export:dest,exportWidth:1920,exportHeight:1080,exportBytes:fs.statSync(dest).size,resize:'Sharp Lanczos3 proportional cover center; slight vertical crop, upscale is not native generated detail',scale:1920/meta.width,verticalCropSourcePixels:meta.height-meta.width*1080/1920,prompt:path.join(root,'prompts',name+'.txt')});}
fs.writeFileSync(path.join(root,'sources','manifest.json'),JSON.stringify(manifest,null,2));console.log(manifest.map(({name,originalWidth,originalHeight,exportBytes,verticalCropSourcePixels})=>({name,originalWidth,originalHeight,exportBytes,verticalCropSourcePixels})));})();
