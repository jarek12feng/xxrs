import type { State } from '../world';
export interface Covenant {
  meeting: 'none'|'remember'|'listen';
  form: 'none'|'quiet'|'friends';
  token: 'none'|'map'|'cord';
  promise: 'none'|'return'|'letters';
  witnesses: string[];
}
export type CovenantChoice =
  | {kind:'covenant'; topic:'meeting'; choice:'remember'|'listen'}
  | {kind:'covenant'; topic:'form'; choice:'quiet'|'friends'}
  | {kind:'covenant'; topic:'token'; choice:'map'|'cord'}
  | {kind:'covenant'; topic:'promise'; choice:'return'|'letters'};
export const freshCovenant = ():Covenant => ({meeting:'none',form:'none',token:'none',promise:'none',witnesses:[]});
export function validCovenant(c:Covenant) {
 return !!c && ['none','remember','listen'].includes(c.meeting) && ['none','quiet','friends'].includes(c.form) && ['none','map','cord'].includes(c.token) && ['none','return','letters'].includes(c.promise) && Array.isArray(c.witnesses) && c.witnesses.length<=12 && new Set(c.witnesses).size===c.witnesses.length && c.witnesses.every(x=>typeof x==='string'&&x.length<=80);
}
export const covenantReady = (c:Covenant) => [c.meeting,c.form,c.token,c.promise].every(v=>v!=='none');
export const partnerName = (s:State) => s.social.gender==='male'?'苏婉宁':'尹照川';
export function covenantMemory(s:State) {
 if(s.social.gender!=='male') return '你们在灯下慢慢说起各自走过的路。';
 const q=s.foundationJourney;
 if(q.target==='companion' && q.rescue===4 && q.won.includes('rescue')) return '你提起古道断讯的那一夜：你在外侧送进绳索，她在石室里标出落点。最后一步踏空时，是她拉住了你。';
 if(q.heroine.map!=='none') return '她展开重订过的路图，指腹停在你们一同改过的那段线旁。';
 return '你把旧日同行的事慢慢说起，她听着，偶尔补上一处你记岔的细节。';
}
export function covenantChoiceText(s:State,a:CovenantChoice):string {
 const name=partnerName(s), she=s.social.gender==='male'?'她':'他';
 if(a.topic==='meeting') return a.choice==='remember'
  ? `${covenantMemory(s)}${name}低头笑了：“那时只顾着让彼此活着回来，倒没想过，后来还能一起坐这么久。”`
  : `${name}将行囊放在脚边。你没有先提自己的长关，而是问起${she}下一程的打算。${she}想了片刻：“我还有想走的路。若与你结契，我也想把它走完。”你答：“我想与你相伴，没想替你收起行囊。”`;
 if(a.topic==='form') return a.choice==='quiet'
  ? `${name}看着院中两盏灯：“不必把古渡都惊动。我们把话说清，天地听见就够了。”你将客席收在檐下，只留一张小案。`
  : `你们一同写下愿意相邀的名字，只请仍能联系上的旧识。${name}在帖尾添了一句：“来吃一盏茶便好，不必备礼。”院中多摆了几只茶盏。`;
 if(a.topic==='token') return a.choice==='map'
  ? `你裁下随身旧图的一角，照着同一条归路描成两份。${name}接过其中一份：“图会旧，路也会改。若走不通，就重新画，别独自硬闯。”`
  : `你将两截素绳并在案上，一人系一结。${name}试了试结扣：“系紧些，别赶一程路就弄丢了。”${she}把另一截放进你掌心。`;
 return a.choice==='return'
  ? `你说：“每逢长关，先留下归处。出关后，先回一封平安信；能相见时，就坐下来吃顿饭。”${name}应下，又补道：“若遇险，不必逞强赶路。信里说实话。”`
  : `你说：“各自远行，也别让旧信替我们说一辈子的话。换了落脚处，就留新信路。”${name}把两个驿站记在纸上：“收不到信，先打听；不要一声不响地闯进险地。”`;
}
export function covenantCeremonyText(s:State,choice:string):string {
 const c=s.nascentSoul.covenant,name=partnerName(s);
 const token=c.token==='map'?'两份旧图':c.token==='cord'?'两截素绳':'旧日信物';
 switch(choice){
 case 'discuss': return `${name}没有立刻伸手接约书，而是问：“${s.realm===3 && s.nascentSoul.emerged?'你如今平安出关，往后的路又宽了。':'你这次长关，不知要过多少年。'}你想好了，要与我结怎样的约？”你答：“往后有难处，我会早些告诉你。能一道担的，便一道担。”院中潮声渐缓，你们开始商议行礼与信物。`;
 case 'witness': return `${c.form==='friends'?(c.witnesses.length?c.witnesses.join('、')+'在案旁落座。':'旧友未能赶到，你们将回帖收好，仍在灯前行礼。'):'院门轻掩，潮声与两盏灯相伴。'}你们相向而立，将${token}交到彼此手中。${name}先开口：“往后的路，我愿与你相照。”你应道：“愿与你相守，长路共勉，归来相见。”两人的名字落在约书上。`;
 case 'meal': return `灯下只剩你们两人。${name}把温着的饭推过来：“刚才说得郑重，饭倒险些凉了。”你们收起${token}与约书，吃完这顿饭。${c.promise==='return'?'长关之后，先报平安，再赴这一桌家常饭。':c.promise==='letters'?'旧图上又添了两处信驿；下次远行，先把新去向留给彼此。':'你们将旧约仔细收好，慢慢说起往后的打算。'}门外潮涨潮落，这回不必急着道别。`;
 case 'renew': return `你们将旧约摊在灯下。${name}问：“这些年过去，可有哪句话想重新说？”你答：“有。往后遇到难处，我会早些告诉你。”旧信物放回彼此掌心，灯火仍温。`;
 case 'defer': return `${name}收好尚未落款的纸：“不急在今夜。等你我都想清楚，再来点这盏灯。”你们仍照原先的信路往来。`;
 default:return '你在灯前整理行囊，把长关的去向写清，交给渡口信驿。';
 }
}
export function covenantReturnText(s:State) {
 const c=s.nascentSoul.covenant;
 return c.promise==='return'?'你照约先寄出平安信，问那顿家常饭可还留着。':c.promise==='letters'?'你将新的落脚处写入信中，沿约定的信驿送出。':'你循旧有信路，送出一封平安信。';
}
