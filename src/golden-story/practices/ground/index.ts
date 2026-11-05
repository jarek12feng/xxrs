import type { State } from '../../../world';

export interface PracticeState {
  topic: 'ground'; schema: 2;
  guard: 'none'|'inner'|'outer'|'divided';
  outlet: boolean;
  rack: 'edge'|'inner'|'high';
  debris: boolean;
  soaked: boolean;
  outcome: 'pending'|'sheltered'|'transferred';
}
export const fresh = (step:0|1):PracticeState => ({topic:'ground',schema:2,guard:'none',outlet:false,rack:step===0?'inner':'edge',debris:step===1,soaked:false,outcome:'pending'});
export function valid(x:unknown):x is PracticeState {
  if(!x || typeof x!=='object') return false;
  const v=x as PracticeState;
  return v.topic==='ground' && v.schema===2 && ['none','inner','outer','divided'].includes(v.guard)
    && typeof v.outlet==='boolean' && ['edge','inner','high'].includes(v.rack)
    && typeof v.debris==='boolean' && typeof v.soaked==='boolean'
    && ['pending','sheltered','transferred'].includes(v.outcome)
    && (v.outcome==='pending' || (!v.soaked && (v.outcome==='sheltered' ? v.rack==='inner' && ['inner','divided'].includes(v.guard) : v.rack==='high')));
}
/** Preserve old placements and opened return flow, never infer a completed result. */
export function upgrade(old:unknown,step:0|1):PracticeState {
  if(valid(old)) return {...old};
  const next=fresh(step);
  if(!old || typeof old!=='object') return next;
  const v=old as Record<string,unknown>;
  if(v.topic!=='ground' || v.schema!==undefined) return next;
  if(typeof v.outlet==='boolean') next.outlet=v.outlet;
  if(v.guard==='inner'||v.guard==='outer') next.guard=v.guard;
  // The old completed supply preparation becomes a clear working aisle.
  if(v.supply===2) next.debris=false;
  return next;
}
export const choices:{move:string,label:string}[]=[
  {move:'ground-inner',label:'收阵护住内圈'},
  {move:'ground-outer',label:'沿通道布外护'},
  {move:'ground-divide',label:'运分念诀 · 同护药架与通道'},
  {move:'ground-open',label:'打开回流口 · 导向外渠'},
  {move:'ground-close',label:'关闭回流口 · 潮水留在外场'},
  {move:'ground-clear',label:'移开通道浮木'},
  {move:'ground-gather',label:'把药架收入内圈'},
  {move:'ground-transfer',label:'沿通道移往高台'},
  {move:'ground-dry',label:'收潮晾架 · 恢复试药'},
  {move:'ground-test',label:'放行试潮 · 看药架是否安稳'},
];
export function quote(s:State,move:string) {
  const p=s.goldenStory.practice as unknown as {topic:string;step:0|1;material:unknown}|undefined;
  const current=p?.material;
  const next=valid(current)?{...current}:fresh(p?.step===1?1:0);
  const result={error:'',herbs:0,next,failed:false,passed:false,note:''};
  const reject=(error:string)=>({...result,error});
  if(!p || p.topic!=='ground' || !valid(current) || ![0,1].includes(p.step) || !choices.some(c=>c.move===move))return reject('当前没有这项护阵操作');
  if(next.outcome!=='pending')return reject('药架已经安置妥当');
  switch(move){
    case 'ground-inner':
    case 'ground-outer':
    case 'ground-divide': {
      const guard=move==='ground-inner'?'inner':move==='ground-outer'?'outer':'divided';
      if(guard==='divided' && s.spirit.manual!=='learned')return reject('尚未研修分念诀，无法同时维持两处护持');
      if(next.guard===guard)return reject('护阵已在此处，无须重布');
      next.guard=guard;result.note=guard==='inner'?'护阵缩入内圈，圈外的药架不在护持之下。':guard==='outer'?'护阵沿搬运通道铺开，药架离开内圈时，道路有了遮护。':'两缕神念分别守住药架和通道，外场回潮被隔在两处护持之外。';break;
    }
    case 'ground-open':case 'ground-close':
      if(next.outlet===(move==='ground-open'))return reject('回流口已是这个状态');
      next.outlet=move==='ground-open';result.note=next.outlet?'回潮折入外渠，搬运通道水势平缓。':'回潮留在外场；内圈可独立护药，外场搬运须兼顾药架和道路。';break;
    case 'ground-clear':
      if(!next.debris)return reject('通道已无浮木');
      next.debris=false;result.note='你用长钩将浮木拉上岸，搬运通道露出来了。';break;
    case 'ground-gather':
      if(next.rack==='inner')return reject('药架已在内圈');
      next.rack='inner';result.note='药架沿短轨收入内圈；外场回潮不必经过这条短轨。';break;
    case 'ground-transfer':
      if(next.rack==='high')return reject('药架已在高台');
      if(next.debris)return reject('浮木挡住了药架的轮子');
      if(next.guard!=='divided' && !(next.guard==='outer' && next.outlet))return reject('搬运时药架暴露在回潮中，当前护持未能遮住这段路');
      next.rack='high';result.note='药架沿护持通道移上高台，已离开潮水能抵达的低处。';break;
    case 'ground-dry':
      if(!next.soaked)return reject('试药仍干燥，无须晾架');
      next.soaked=false;result.note='收回试潮，晾干试药；药架位置、通道和护阵仍按你的布置保留。';break;
    case 'ground-test':
      result.passed=!next.soaked && (next.rack==='high' || (next.rack==='inner' && ['inner','divided'].includes(next.guard)));
      if(result.passed){next.outcome=next.rack==='high'?'transferred':'sheltered';result.note=next.outcome==='sheltered'?'试潮绕过内圈，药架留在原地仍然干燥。':'试潮淹过低处，药架已在高台，试药安然无损。';}
      else {next.soaked=true;result.failed=true;result.note='试潮沾湿了未受保护的试药；药架和阵石没有损坏，布置仍然保留。';}
      break;
  }
  return result;
}
export function view(p:{step:0|1;material:unknown}) {
  const v=valid(p.material)?p.material:fresh(p.step);
  return {title:p.step===0?'护阵示范 · 内圈药架':'回潮入场 · 护药还是转移',
    clue:'让试药经受回潮而不受损。',
    visual:'药架、回流口与搬运通道',status:[`药架：${{edge:'外沿',inner:'内圈',high:'高台'}[v.rack]} · ${v.soaked?'试药待晾干':'试药干燥'}`,`护持：${{none:'尚未布阵',inner:'内圈药架',outer:'搬运通道',divided:'药架与通道同时护持'}[v.guard]}`,`回流：${v.outlet?'流入外渠':'留在外场'} · 通道${v.debris?'被浮木挡住':'畅通'}`,v.outcome==='pending'?'尚未验潮':v.outcome==='sheltered'?'药架就地保全':'药架已转移保全']};
}
export const solution=(step:0|1):string[]=>step===0?['ground-inner','ground-test']:['ground-open','ground-outer','ground-clear','ground-transfer','ground-test'];
