import type { State } from '../world';
import type { Pose } from '../presentation/art';
import { awaitingFerryConversation } from './heroine';
export type FoundationPerformance = 'meeting' | 'map' | 'inherit' | 'refine' | 'supply' | 'rescue' | 'estateFlow' | 'snowLine' | 'wellOpen' | 'circulation';
export function foundationSceneSnapshot(s: State) {
  const q = s.foundationJourney;
  return { location:q.location, duel:!!q.duel, meeting:q.heroine.meeting, map:q.heroine.map,
    inheritance:q.inheritance, refined:q.growth.refined, supplied:q.heroine.supplied, rescued:q.rescue === 4, estateFlow:q.sides.estate.step>=2, snowLine:q.sides.snow.step>=2, wellOpen:q.ferry>=2, circulation:q.won.includes('culmination') };
}
export type FoundationSceneSnapshot = ReturnType<typeof foundationSceneSnapshot>;
/** Only compare persisted snapshots. Mounting a completed save is never an action. */
export function foundationSceneTransition(a: FoundationSceneSnapshot, b: FoundationSceneSnapshot): FoundationPerformance | undefined {
  if (b.duel || a.location !== b.location) return;
  if (!a.rescued && b.rescued) return 'rescue';
  if (!a.circulation && b.circulation && b.location==='frontier') return 'circulation';
  if (!a.estateFlow && b.estateFlow && b.location==='estate') return 'estateFlow';
  if (!a.snowLine && b.snowLine && b.location==='snow') return 'snowLine';
  if (!a.wellOpen && b.wellOpen && b.location==='ferry') return 'wellOpen';
  if (!a.supplied && b.supplied) return 'supply';
  if (!a.refined && b.refined) return 'refine';
  if (a.inheritance === 'none' && b.inheritance !== 'none') return 'inherit';
  if (a.map === 'none' && b.map !== 'none') return 'map';
  if (a.meeting === 'none' && b.meeting !== 'none') return 'meeting';
}
export const foundationPerformanceFrames: Record<FoundationPerformance, readonly { label:string; pose:Pose; prop:string; companion:'work'|'travel' }[]> = {
  estateFlow:[{label:'老根下的细渠露出',pose:'guard',prop:'herbs',companion:'travel'},{label:'育苗木签连成一线',pose:'idle',prop:'map',companion:'travel'}],
  snowLine:[{label:'绳槽接起西门留引',pose:'guard',prop:'lamp',companion:'travel'},{label:'西门的退路已经试通',pose:'idle',prop:'map',companion:'travel'}],
  wellOpen:[{label:'石偶垂下手臂',pose:'idle',prop:'lamp',companion:'travel'},{label:'传承室亮了起来',pose:'idle',prop:'lamp',companion:'travel'}],
  circulation:[{label:'三股乱流归于一息',pose:'meditate',prop:'',companion:'travel'},{label:'周天气息已稳',pose:'idle',prop:'',companion:'travel'}],
  meeting:[{label:'石梁已稳',pose:'guard',prop:'map',companion:'work'},{label:'记下落脚处',pose:'idle',prop:'map',companion:'work'}],
  map:[{label:'撤下旧刻样',pose:'idle',prop:'map',companion:'work'},{label:'重订路图',pose:'idle',prop:'map',companion:'work'},{label:'收好副图',pose:'idle',prop:'map',companion:'travel'}],
  inherit:[{label:'展卷辨法',pose:'idle',prop:'manual',companion:'travel'},{label:'传承已收好',pose:'meditate',prop:'manual',companion:'travel'}],
  refine:[{label:'主材已炼化',pose:'meditate',prop:'vial',companion:'travel'},{label:'灵元渐稳',pose:'idle',prop:'vial',companion:'travel'}],
  supply:[{label:'补给送入内侧',pose:'guard',prop:'herbs',companion:'travel'},{label:'归绳已稳',pose:'idle',prop:'herbs',companion:'travel'}],
  rescue:[{label:'内外接应已成',pose:'guard',prop:'lamp',companion:'travel'},{label:'众人回到落脚点',pose:'idle',prop:'lamp',companion:'travel'}],
};
/** Presence is narrower than portrait availability: no companion while away or inside the well. */
export function foundationCompanionPresent(s: State, mode: string) {
  const q=s.foundationJourney;
  if (mode==='board' || q.duel || s.social.gender!=='male') return false;
  if (mode==='relationship') return ['home','returned','rescued'].includes(q.whereabouts);
  return (q.location==='home' && !['away','missing','shelter'].includes(q.whereabouts)) ||
    (q.location==='ferry' && q.ferry===0 && q.heroine.meeting!=='none') || awaitingFerryConversation(s) ||
    (q.location==='frontier' && q.rescue===4 && q.whereabouts==='rescued');
}

/** Persistent scenery is location-bound; no historical prop follows the player elsewhere. */
export function foundationSiteState(s: State, mode: string) {
  const q=s.foundationJourney, visible=mode==='journey' && !q.duel;
  return {
    estate:visible && q.location==='estate' && q.sides.estate.step>=2,
    snow:visible && q.location==='snow' && q.sides.snow.step>=2,
    well:visible && q.location==='ferry' && q.ferry===2,
    circulation:visible && q.location==='frontier' && q.won.includes('culmination'),
  };
}
