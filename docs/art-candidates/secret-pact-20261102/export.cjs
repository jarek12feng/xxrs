const fs = require('fs');
const path = require('path');
const sharp = require('/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base=__dirname;
const source='/Users/admin/.codex/generated_images/01a19b12-32f0-7272-abd0-bb8e2f202471';
const assets=[
 ['he-chong-dialogue','exec-48ce9c19-d5c2-4600-ba5d-2cdf7a2b2d27.png',512],
 ['ye-zhao-dialogue','exec-5a56c0da-d0a7-4ba1-a1d0-ccaf03908c4e.png',512],
 ['he-chong-combat','exec-cb853169-3e44-4780-bcbf-c49a23bdc8ba.png',640],
 ['zhaoxuan-chamber','exec-30b33dbe-b3b0-4ef4-a851-6d4ac19b7d87.png',1200],
 ['zhaoxuan-jade-slip','exec-d0fb0390-44b0-488b-9294-e2622a2107e1.png',256]
];
(async()=>{
 const rows=[];
 for(const [name,file,width] of assets){
  const original=path.join(base,'originals',name+'.png');
  if(!fs.existsSync(original))fs.copyFileSync(path.join(source,file),original);
  const out=path.join(base,'exports',name+'.webp');
  await sharp(original).resize({width}).webp({quality:86,alphaQuality:100,effort:6}).toFile(out);
  rows.push({name,source:file,original:await sharp(original).metadata(),export:await sharp(out).metadata(),bytes:fs.statSync(out).size});
 }
 fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify(rows,null,2));
 const comps=[];
 for(let i=0;i<3;i++){
  const img=path.join(base,'exports',assets[i][0]+'.webp');
  for(let j=0;j<2;j++) comps.push({input:await sharp(img).resize(256,384,{fit:'contain',background:'#00000000'}).flatten({background:j?'#162329':'#e5e1d8'}).png().toBuffer(),left:i*256,top:j*384});
 }
 for(const [i,size] of [48,64].entries())for(let j=0;j<2;j++)comps.push({input:await sharp(path.join(base,'exports/zhaoxuan-jade-slip.webp')).resize(size,size).flatten({background:j?'#162329':'#e5e1d8'}).png().toBuffer(),left:32+i*100+j*320,top:800});
 await sharp({create:{width:768,height:900,channels:3,background:'#999999'}}).composite(comps).png().toFile(path.join(base,'qa-contact-sheet.png'));
 console.log(rows.map(r=>[r.name,`${r.original.width}x${r.original.height}`,`${r.export.width}x${r.export.height}`,r.bytes]));
})();
