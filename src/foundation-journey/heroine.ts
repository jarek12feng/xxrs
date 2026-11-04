import { grantTechnique } from "../techniques";
import type { State } from '../world';
import type { JourneyAction } from './state';
import type { ResourceRoute } from './growth-state';
import { methodError, type Method } from '../companionship/rules';
import { plans } from '../companionship/content';
export interface HeroineJourney {
  meeting: 'none' | Method;
  purpose: 'none' | 'longevity' | 'strength' | 'private';
  route: 'none' | ResourceRoute;
  map: 'none' | 'public' | 'detour';
  expedition: boolean;
  supplied: boolean;
}
export const freshHeroine = (): HeroineJourney => ({meeting:'none',purpose:'none',route:'none',map:'none',expedition:false,supplied:false});
export const maleMainline = (s: State) => s.social.gender === 'male';
export const hasMainlineMeeting = (s: State) => maleMainline(s) && !!s.foundationJourney?.heroine && s.foundationJourney.heroine.meeting !== 'none';
export const awaitingFerryConversation = (s: State) => hasMainlineMeeting(s) && s.foundationJourney.location === 'ferry' && s.foundationJourney.ferry <= 1 && s.foundationJourney.heroine.purpose === 'none' && !s.foundationJourney.duel;
export const sharedJourneyDone = (s: State) => maleMainline(s) ? !!s.foundationJourney?.heroine && s.foundationJourney.heroine.map !== 'none' : s.companionship.stage === 'done';
export const mainlineRomanceReady = (s: State) => hasMainlineMeeting(s) && sharedJourneyDone(s) && s.foundationJourney.reunion;
export type HeroineAction = Extract<JourneyAction,{kind:'meetHeroine'|'journeyPurpose'|'mapPlan'|'expeditionPlan'}>;
export const isHeroineAction = (a: JourneyAction): a is HeroineAction => ['meetHeroine','journeyPurpose','mapPlan','expeditionPlan'].includes(a.kind);
export function heroineError(s: State,a: HeroineAction) {
  const q=s.foundationJourney,h=q.heroine;
  if(!maleMainline(s)) return '此处无可赴之约';
  if(a.kind==='meetHeroine') {
    if(q.location!=='home' || !s.adventure.road.surveyed || h.meeting!=='none') return '踏勘青嶂归路后，回行前居商议石梁勘路';
    if(!['strength','insight','supplies'].includes(a.method)) return '未知开路方法';
    return methodError(s,a.method);
  }
  if(a.kind==='journeyPurpose') return hasMainlineMeeting(s) && q.location==='ferry' && h.purpose==='none' && ['longevity','strength','private'].includes(a.purpose) ? '' : '相识后到无名渡，在入井前谈谈各自来意';
  if(a.kind==='mapPlan') {
    if(q.location!=='home' || h.route==='none' || h.map!=='none' || !q.growth.refined || !['public','detour'].includes(a.plan)) return '择路同行并炼化主材后，回行前居交接路图';
    return s.stones<plans[a.plan].cost ? `需灵石 ${plans[a.plan].cost} 购置尺绳与路标；公开干道方案不耗灵石` : '';
  }
  return q.location==='home' && q.cultivation>=400 && q.reunion && !h.expedition ? '' : '筑基后期、按约重逢后，在行前居听取下一次探路安排';
}
export function applyHeroine(s: State,a: HeroineAction) {
  const q=s.foundationJourney,h=q.heroine;
  if(a.kind==='meetHeroine') {
    const knewGuard=s.journey.known.includes('guard');
    h.meeting=a.method;
    if(a.method==='supplies')s.herbs-=4;
    grantTechnique(s, 'guard');
    s.social.met=true;s.social.metMonth=s.month;s.social.affection=Math.max(8,s.social.affection);s.social.answers.meet='bridge';
    q.last=({strength:'你卸去松石的力道，稳住石梁。',insight:'你循灵流辨出承力处，避开空壳石。',supplies:'你用灵草 4 护住根系，让石梁不再下沉。'}[a.method])+'崖下的女修收紧尺绳，测出能背粮通行的落脚处。“苏婉宁。”她将新标记画给你看，“我想画一张不用御剑也走得通的图。你若去无名渡，这段路我们正好同行。”'+(knewGuard?'你以已学的护身诀稳住灵流，与她核对了护根的手法。':'你记下护住周身灵流的方法，习得护身诀。')+(s.social.origins.includes('route-map')?'你认出了药庐旧图上同样的改线。她听你提起，笑着将错过的浅滩也补了上去。':'');
  } else if(a.kind==='journeyPurpose') {
    h.purpose=a.purpose;
    s.social.affection=Math.min(100,s.social.affection+4);
    q.last=({longevity:'你说想求长生，看看百年之外的天地。她收住尺绳：“那可远得很。眼前这段，我先陪你走。”',strength:'你说不想再被一道旧阵挡住。她把尺绳递来：“我也不想只画别人走过的地方。”',private:'你暂时没有细说。她点点头，把自己的测渡计划摊开，没有继续追问。'}[a.purpose])+'她核对水位、留好撤退绳路，你独自去争沉井传承。';
  } else if(a.kind==='mapPlan') {
    s.social.affection=Math.min(100,s.social.affection+12);
    h.map=a.plan;s.stones-=plans[a.plan].cost;
    q.last='“我没写名字。”苏婉宁看着图上的井口和果树，终于放下刻刀，“可这些已经够找到他们了。”她自己撤下刻样，和你重新商量。'+plans[a.plan].result+'你们试过新的路标，又约好：短线止步，双点回讯。她将一份副图交给你，准备各走一段远路。';
  } else {
    h.expedition=true;
    q.last='苏婉宁摊开古道图：“这回跟闻岑往深处走，陶泊在外缘接船。旧阵近日有些错移，我另备了一套路标，先认退路，再往里探。”你们重试短线与双点的回讯，约好在外缘接应。待行装备妥，再去古道问消息。';
  }
}
export function heroineGoal(s: State): string {
  if(!maleMainline(s))return '';
  const q=s.foundationJourney,h=q.heroine;
  if(!s.adventure.road.surveyed)return '';
  if(h.meeting==='none')return '回听松行前居，商议青嶂石梁的勘路之事。';
  if(h.purpose==='none')return '与苏婉宁同往无名渡，在入井前交流各自来意。';
  if(q.growth.refined && h.map==='none')return '主材已炼化，回行前居与苏婉宁修订路图，避开沿途人家的住处。';
  if(h.map!=='none' && !q.reunion) {
    if(q.whereabouts==='away') {
      const remaining=Math.max(0,(q.departedAt ?? s.month)+3-s.month);
      return remaining>0
        ? `她已按约去复测一段旧路；距重逢还需 ${remaining} 个月，可先继续修炼。`
        : '约定的重逢之期已到，回听松行前居与苏婉宁互看修行所得。';
    }
    return q.contact==='none'?'回行前居与苏婉宁约好联络，再各自远行。':'回行前居与苏婉宁道别，约好重逢之期。';
  }
  if(q.cultivation>=400 && !h.expedition)return '回行前居听苏婉宁说明下一次古道探路的计划与备用标记。';
  if(h.expedition && q.rescue===0)return '前往云外古道，与陶泊核实探路队的消息。';
  if(q.rescue===1)return '用你与苏婉宁约定的短线、双点标记问讯，先确认队伍处境。';
  if(q.rescue===2)return h.supplied?'外缘补给已送达，向程砚学习稳脉，商定内层接应。':q.won.includes('frontier')?'外缘道路已经打通；送入补给，稳住归绳。':'击退外缘石偶，送入第一批补给；内侧已有同道回讯。';
  if(q.rescue===3)return '苏婉宁已经标好内侧落点；备好功法与灵器，入内接应。';
  return '';
}
