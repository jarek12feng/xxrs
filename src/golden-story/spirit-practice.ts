import type { State } from '../world';
import type { TeachingMove, TeachingPractice } from './teaching';
export interface SpiritPractice { anchored:boolean; echoes:0|1|2; pressure:0|1|2 }
export const freshSpiritPractice = (step:0|1=0):SpiritPractice => ({anchored:false,echoes:0,pressure:step===1?2:0});
export function validSpiritPractice(x:unknown):x is SpiritPractice {
 const v=x as SpiritPractice;
 return !!v && typeof v.anchored==='boolean' && [0,1,2].includes(v.echoes) && [0,1,2].includes(v.pressure);
}
export const spiritChoices:readonly {move:TeachingMove;label:string}[] = [
 {move:'anchor',label:'守住本念 · 稳住中心、缓下一层识压'},
 {move:'listen',label:'逐股听辨 · 留下一股回声线索'},
 {move:'split',label:'运分念诀 · 同时追踪两股回声，识压上升'},
 {move:'ease',label:'收息缓压 · 保留已辨线索'},
 {move:'herb',label:'灵草护神 · 灵草2，稳念并散去识压'},
 {move:'close',label:'收念重来 · 放下线索，重新稳住本念'},
 {move:'confirm',label:'放开试阵 · 检验护神与听辨'},
];
/** Quote and settlement share this resolver; local manipulations consume no world months. */
export function spiritPracticeQuote(s:State,move:TeachingMove) {
 const p=s.goldenStory.practice;
 const current=p?.spirit;
 let error='',herbs=0,failed=false,passed=false;
 let note='';
 const next:SpiritPractice={...(current??freshSpiritPractice())};
 if(!p || p.topic!=='spirit' || !current || !spiritChoices.some(c=>c.move===move)) error='当前没有这项听潮操作';
 else if(move==='split' && s.spirit.manual!=='learned') error='须先研修分念诀；也可守住本念，逐股听辨';
 else if(move==='herb' && next.anchored && next.pressure===0) error='本念已稳，识压已散，无须再耗灵草';
 else if(move==='herb' && s.herbs<2) error='需灵草2；也可收息缓压，不耗物资';
 if(error)return {error,herbs,next,failed,passed,note};
 switch(move){
 case 'anchor':next.anchored=true;next.pressure=Math.max(0,next.pressure-1) as 0|1|2;note='中央细光稳住，识压缓下一层；已辨回声仍留在案上。';break;
 case 'listen':
  if(!next.anchored || next.pressure===2){failed=true;next.pressure=2;next.echoes=Math.max(0,next.echoes-1) as 0|1;note=`回声被潮声盖过，现存线索只余${next.echoes}股。本念未稳或识压过高时，听辨难以持续。`;}
  else {next.echoes=Math.min(2,next.echoes+1) as 1|2;next.pressure=Math.min(2,next.pressure+(p!.step===1?1:0)) as 0|1|2;note=p!.step===1?'你记下一股横潮回声，横潮也添了一层识压。':'一股回声的来去显在石案上，另一股仍可接着听辨。';}break;
 case 'split':next.echoes=2;next.pressure=Math.min(2,next.pressure+1) as 1|2;note='两缕神念同时追到两股回声，线索齐了；识压也随分念上升，中心仍须有人守住。';break;
 case 'ease':next.pressure=0;note='你缓下呼吸，让识压散去；本念与已辨线索都还在。';break;
 case 'herb':herbs=2;next.anchored=true;next.pressure=0;note='灵草护住中央一念，识压散去；两侧已辨的线索没有丢失。';break;
 case 'close':next.anchored=true;next.pressure=0;next.echoes=0;note='你收回神念，石案两侧线索消去，中心重新稳住；可以另换办法。';break;
 case 'confirm':
  passed=next.anchored && next.echoes===2 && next.pressure<=1;
  if(passed)note=p!.step===0?'初试中，你护住自身也辨清了两股回声。传讲人转动听潮石：横潮压来，逐股听辨时识压会随之增加，再亲手接住这次变化。':'横潮穿过石案，你守住本念，两股回声仍清楚可辨。护神与运神，这回都由你自己接住了。';
  else {failed=true;next.pressure=2;next.echoes=Math.max(0,next.echoes-1) as 0|1;note=`试阵一放开，神念没能同时护住中心与两股回声。识压涌起，现存线索只余${next.echoes}股；余下进度仍可接续。`;}break;
 }
 return {error,herbs,next,failed,passed,note};
}
export function spiritPracticeView(p:TeachingPractice) {
 return {title:p.step===0?'听潮：护住本念，辨清双声':'横潮实测：听辨会积起识压',clue:p.step===0?'两股回声绕过中央细光。让本念稳住、两股线索都清楚，且识压不高于一层，再放开试阵。':'横潮不断压向神念。逐股听辨每次会添一层识压；分念能同时追踪两股。放开试阵前，要兼顾中心、双声与识压。',visual:'本念与双声'};
}
