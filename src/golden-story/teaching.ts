import type { State } from '../world';
import type { TeachingTopic } from './state';
export type TeachingMove = 'ease'|'force'|'join'|'split'|'anchor'|'chase'|'listen'|'close'|'settle'|'mix'|'separate'|'drink'|'vent'|'seal'|'screen'|'stack';
export interface TeachingPractice { topic: TeachingTopic; source:'seat'|'public'; step:0|1; errors:number; feedback:string }
export interface TeachingResult { topic:TeachingTopic; errors:number }
interface Exercise { title:string; clue:string; choices:readonly {move:TeachingMove;label:string}[]; answer:TeachingMove; success:string; failure:string; visual:string }
export const teachingExercises:Record<TeachingTopic,readonly [Exercise,Exercise]> = {
 method:[
  {title:'旧脉接新流',clue:'石案上，两道灵流在交界处相撞。旧脉仍急，新流尚弱；此时强催，只会让滞处更紧。',choices:[{move:'ease',label:'缓下旧脉，留出接续余地'},{move:'force',label:'催强丹元，一举冲开滞处'}],answer:'ease',success:'你缓下旧脉，交界处的急旋渐渐松开。案上两线已同向，却仍各自起落。',failure:'两股灵流越催越紧，石案发出轻鸣。传讲者按住阵心：“先让旧脉缓下来。接续不是相争。”',visual:'双流交汇'},
  {title:'一息相承',clue:'新流每三息回转一次，旧脉还快半拍。须使二者同息，不能让两套行气各走各的。',choices:[{move:'split',label:'分开两路，各自催运'},{move:'join',label:'候新流回转，再接旧脉'}],answer:'join',success:'你候到灵流回转才续入旧脉，两线终于合成一道平稳的光。滞涩所在，如今已能亲手辨明。',failure:'两线再次分岔，灵光忽明忽暗。“看清它回转的时刻，再接上去。”',visual:'两线同息'}],
 spirit:[
  {title:'潮声中守一念',clue:'石案录影化出三重潮声，最亮的浮光不断移位；中央的细光虽弱，却一直未断。',choices:[{move:'chase',label:'追逐最亮的浮光'},{move:'anchor',label:'守住中央不断的细光'}],answer:'anchor',success:'你不再逐浪而走，中央细光稳了下来，外圈潮声仍起伏不休。',failure:'浮光一变，神念也随之散开。“亮处未必是根，寻那一线不断的。”',visual:'潮声扰神'},
  {title:'守而不闭',clue:'守住本念之后，潮声里出现一道逆流。若将外界尽数隔绝，便无法察觉它。',choices:[{move:'listen',label:'留一线神念听辨逆流'},{move:'close',label:'封闭神识，隔绝一切潮声'}],answer:'listen',success:'你守住中央一念，又分出细丝辨明逆流。案上乱光渐息，护神与运神的分别终于落在了自己手上。',failure:'潮声虽静，逆流却悄然穿过。传讲者叩案：“护住自己，也要听见外面。”',visual:'一念分听'}],
 pill:[
  {title:'辨清沉浮',clue:'两只试药盏里，清亮药息缓缓下沉，灰青细雾却贴着盏沿上浮。录中记着：潮毒性轻，遇温而升。',choices:[{move:'settle',label:'温盏静候，观察清浊分层'},{move:'mix',label:'搅匀两股药息'}],answer:'settle',success:'温意透入盏底，灰青雾气浮成薄薄一层，下面的清亮药息依然完整。',failure:'清浊重新混作一团。传讲者移来空盏：“急不得，先让它们各现本性。”',visual:'药盏分层'},
  {title:'取清去浊',clue:'灰雾已浮在盏口。侧边的小孔可将它引入空盏，清亮药息仍留在底部。',choices:[{move:'drink',label:'趁药息旺盛，试服一口'},{move:'separate',label:'开侧孔，引灰雾入空盏'}],answer:'separate',success:'灰雾被引入空盏，底部药息转为澄澈。传讲者收起试盏，将离照候潮的记号添在你的路图上：“试药与真药还有分别，到那里再验一回。”',failure:'传讲者拦住你的手：“清浊未分，怎可入口？”药盏仍停在案上，须先引走浮毒。',visual:'清浊分盏'}],
 ground:[
  {title:'灵地须有来去',clue:'石盘东侧灵流入阵，西侧却堵在一块阵石前。阵心越亮，盘沿的裂纹反而越深。',choices:[{move:'seal',label:'封住四面，把灵流尽数留下'},{move:'vent',label:'移开西侧阵石，疏通回流'}],answer:'vent',success:'你移开阵石，西侧回流通了，盘沿裂纹不再扩展。',failure:'灵流在盘中挤作一团。“有进须有出。蓄得多，不等于用得稳。”',visual:'阵盘壅流'},
  {title:'内外各守其位',clue:'内阵已经平稳，盘外忽有乱流掠过。外缘还留有一圈空槽，可与内阵分开布置。',choices:[{move:'screen',label:'沿外槽布护阵，隔开外扰'},{move:'stack',label:'把护阵压在内阵阵心上'}],answer:'screen',success:'外圈阵纹接住乱流，内圈仍缓缓运转。你将两圈阵位分别画下：供灵归供灵，护持归护持。',failure:'两阵争用一处阵心，内圈先乱了。“外事留在外面，别让护持反扰了行功。”',visual:'内外双阵'}],
};
export const teachingSolution=(topic:TeachingTopic):TeachingMove[]=>teachingExercises[topic].map(x=>x.answer);
export function teachingSpeaker(s: State, source: 'seat'|'public') {
 const present = source === 'seat' && s.month < 2400;
 return { present, name: present ? '沈观微' : '当值传讲人', hotspot: present ? '沈观微 · 问法席' : '当值传讲人 · 论法实录',
 introduction: present ? '沈观微听完你的疑处，将一缕灵光引到石案上。' : '当值传讲人展开沈观微留下的论法实录，照着旧录点亮石案。' };
}
export function teachingIntroduction(s:State,topic:TeachingTopic,source:'seat'|'public') {
 const who=teachingSpeaker(s,source).introduction;
 const method=s.outerSea.method==='none'?'你依旧法行过一个周天。':`你将澄息篇运转一遍，${s.goldenStory.oldRecord?'又取出亲手核过的退潮旧录。':'把潮息接入自身丹元。'}`;
 const past=topic==='spirit'&&s.conclave.depth===2?'归潮深处的潮压，你曾亲身受过；那一瞬的散乱，此刻又浮上心头。':topic==='pill'&&s.conclave.depth===2?'你将带出的灵髓药性记在纸上，却不贸然开封。':method;
 const main=s.journey.main==='blade'?'剑气易锐，转折处尤其不可争先。':s.journey.main==='spring'?'长春生息绵长，更要辨清滋养与壅塞的分别。':'吐纳看似平缓，换息那一瞬才最见根基。';
 return who+past+main+'“先在此处试一回，看清缘由，再谈下一步。”';
}
