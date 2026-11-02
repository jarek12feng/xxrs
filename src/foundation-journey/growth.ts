import type { State } from '../world';
import type { JourneyAction, BattleId } from './state';
import { resourceRoutes, type ResourceRoute, hasSteady } from './growth-state';
export const routeInfo = {
  estate: {name:'药庄养元',material:'养元药心',foe:'salamander',intro:'岑霁正在核对药性：先稳住护圃阵，再引开药泽玄鳞螈，采得成熟药心。',careful:'保全根床 · 灵草 3；后续药量保留',swift:'取成熟药心 · 不额外耗材；当季订单减量'},
  snow: {name:'雪线淬元',material:'寒髓晶',foe:'deer',intro:'霜角鹿守着采髓点。备好护寒物资，辨清蹄声与霜纹，逼退它后取晶。',careful:'绕行缓坡 · 多一月；交锋承伤 −2',swift:'抢过风口 · 节省一月；交锋承伤 +2'},
  frontier: {name:'古道归元',material:'归元阵髓',foe:'frontier',intro:'裴铸提醒你先看阵枢，再动器物。备好灵器或通达主修，击破外缘石偶，取出阵髓。',careful:'修复回流支点 · 灵石 8；本路线外缘重试免补给',swift:'开单向裂隙 · 不额外耗材；外缘重试照常补给'},
} as const;
export type GrowthAction = Extract<JourneyAction, {kind:'routePrepare'|'routeChoose'|'routeProcess'|'routeRevisit'|'steadyStudy'|'rankGift'}>;
export function isGrowthAction(a: JourneyAction): a is GrowthAction {
  return ['routePrepare','routeChoose','routeProcess','routeRevisit','steadyStudy','rankGift'].includes(a.kind);
}
export function routeForBattle(id: BattleId): ResourceRoute | undefined {
  return resourceRoutes.find(r => routeInfo[r].foe===id);
}
export function growthQuote(s: State, a: GrowthAction) {
  const q=s.foundationJourney,g=q.growth;
  let stones=0,herbs=0,ward=0,contribution=0,months=1,error='';
  if (a.kind==='rankGift') {
    months=0;
    if (!['medicine','supplies'].includes(a.reward) || q.board.wins.length<3 || g.rankGift) error='入围前八后可择一领取一次补给';
  } else if (a.kind==='steadyStudy') {
    if (!['medicine','practice'].includes(a.method) || q.cultivation<400 || !g.refined || hasSteady(q) || g.steadyStudy!=='none') error='灵元凝练、筑基后期后选择一种稳脉方法';
    else if (q.location !== (a.method==='medicine'?'estate':'frontier')) error='药庄可行功疗程，古道可独立调息';
    if(a.method==='medicine'){stones=18;herbs=2;}else {stones=4;months=3;}
  } else {
    const r=a.route;
    if(!resourceRoutes.includes(r)) return {stones,herbs,ward,contribution,months,error:'未知机缘路线'};
    const p=g.routes[r];
    if(q.location!==r || q.ferry<4 || q.cultivation<200) error='完成离渡并修至筑基中期，到对应地点准备';
    if(a.kind==='routePrepare') {
      if(p.prepared || !['supplies','service'].includes(a.method)) error='已完成准备，或准备方式无效';
      if(r==='frontier' && Math.max(s.journey.relics.sword,s.journey.relics.vial)<2 && (!s.journey.main || s.growth.training[s.journey.main]<2)) error='古道需二阶灵器或通达主修，先到功法灵器准备';
      if(a.method==='supplies'){herbs=r==='estate'?6:3;ward=1;stones=4;}else stones=24;
    }
    if(a.kind==='routeChoose') {
      if(!p.prepared || p.choice || !['careful','swift'].includes(a.choice)) error='先完成整备；现场取舍只定一次';
      months=r==='snow' && a.choice==='careful'?1:0;
      if(a.choice==='careful'){if(r==='estate')herbs=3;if(r==='frontier')stones=8;}
    }
    if(a.kind==='routeProcess') {
      if(!p.choice || !q.won.includes(routeInfo[r].foe) || p.processed || !['self','service','sect'].includes(a.method)) error='先赢得路线主材；每份只可处理一次';
      if(a.method==='self'){herbs=6;stones=4;months=2;}
      if(a.method==='service')stones=28;
      if(a.method==='sect'){contribution=s.recognition.innerMonth !== null ? 6 : 8;if(s.journey.branch==='none')error='加入师门后可借用丹房；也可自行处理或付费';}
    }
    if(a.kind==='routeRevisit') {
      if(!p.processed || p.revisited) error='取材炼化后可回访一次';
      herbs=r==='estate'?2:0;
    }
  }
  if(!error && (s.stones<stones || s.herbs<herbs || s.workshop.ward<ward || s.journey.contribution<contribution)) error=`需灵石 ${stones}、灵草 ${herbs}、护脉丹 ${ward}、贡献 ${contribution}；可劳作、采药或到工坊筹备`;
  return {stones,herbs,ward,contribution,months,error};
}
export function applyGrowth(s: State,a: GrowthAction) {
  const q=s.foundationJourney,g=q.growth,cost=growthQuote(s,a);
  s.stones-=cost.stones;s.herbs-=cost.herbs;s.workshop.ward-=cost.ward;s.journey.contribution-=cost.contribution;
  if(a.kind==='rankGift') {
    g.rankGift=true;
    if(a.reward==='medicine'){s.workshop.ward+=2;q.last='记名执事交给你两瓶护脉丹，可留作历练整备。';}
    else {s.stones+=16;s.herbs+=4;q.last='你领下灵石 16、灵草 4，准备下一程。';}
  } else if(a.kind==='steadyStudy') {
    g.steadyStudy=a.method;
    q.last=a.method==='medicine'?'岑霁让你按药性缓急运气：“先稳住，再辨逆流。”疗程已备，亲自完成调息考验才能学会稳脉。':'你照着古道阵纹练了三月，将乱流引向空处。行功之法已记下，还需独自调息一试。';
  } else {
    const p=g.routes[a.route],info=routeInfo[a.route];
    if(a.kind==='routePrepare'){p.prepared=true;q.last=`${info.name}整备完成。${info.intro}`;}
    if(a.kind==='routeChoose'){p.choice=a.choice;q.last=`你选择${a.choice==='careful'?info.careful:info.swift}。此番安排已定，败退后仍可循此路再来。`;}
    if(a.kind==='routeProcess'){p.processed=true;g.refined=true;if(s.social.gender === "male" && q.heroine.route === "none")q.heroine.route=a.route;q.last=`${info.material}经处理融入灵元。灵元凝练已成，修行至 400 可入后期，至 599 再遇瓶颈；另寻主材不会提高此上限。`;}
    if(a.kind==='routeRevisit'){
      p.revisited=true;
      const reward=a.route==='estate'?(p.choice==='careful'?22:12):12;s.stones+=reward;
      q.last=a.route==='estate'?`岑霁收下两份灵草补齐药性记录。${p.choice==='careful'?'根床保住了，药工接下下一季的订单。':'当季可采药量减少，许芦先留下救急的份额。'}本次药材报酬灵石 +${reward}。`:a.route==='snow'?`你将采髓点的退路留给山下药队，护送报酬灵石 +${reward}。鹿群仍在雪线上，没有人追杀它们。`:`裴铸看过阵髓的断面，将${p.choice==='careful'?'修复支点的接法':'单向裂隙的危险'}记在工单上。陶泊付你勘路报酬灵石 +${reward}。`;
    }
  }
  if(s.social.gender === "male" && q.heroine.map === "none" && 'route' in a && ['routePrepare','routeChoose'].includes(a.kind))
    q.last += {estate:'苏婉宁在药床边复核背篓可走的窄路，把住户的井口暂留在未公开的草图上。',snow:'苏婉宁先试绳距，再与你核对风口落点：“我们过得去，还得看背粮的人能不能过。”',frontier:'苏婉宁复测退路，在单向裂隙旁补上止步记号：“这条不能画成来回都通。”'}[a.route];
  q.last+=`（本次灵石 −${cost.stones}、灵草 −${cost.herbs}、护脉丹 −${cost.ward}、贡献 −${cost.contribution}，${cost.months} 月）`;
}
