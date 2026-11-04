import type { State } from '../world';
import type { TravelDestination } from './routes';

/** Geography is learned from durable story facts; rendering never grants knowledge. */
export function knowsInland(s: State, to: TravelDestination): boolean {
  const q=s.foundationJourney, p=s.secretPact;
  if(s.wayfaring.trip && (s.wayfaring.trip.from===to || s.wayfaring.trip.to===to)) return true;
  if(to==='pact') return p.stage!=='none'||p.trial!=='none'||p.site==='zhaoxuan'||p.story.news!=='none'||(['salamander','deer','frontier'] as const).some(k=>q.won.includes(k));
  if(to==='stele') return p.pursuit==='notified'||p.pursuit==='closed'||p.site==='brokenStele';
  if(s.realm<1) return false;
  if(to==='home'||to==='ferry') return true;
  return q.ferry>0||q.inheritance!=='none'||q.location===to||(to!=='frontier' && q.sides[to].step>0);
}
export function knowsLandmark(s: State, key: string): boolean {
  if(key.startsWith('inland-')) return knowsInland(s,key.slice(7) as TravelDestination);
  const n=s.qiJourney.narrative, a=s.adventure;
  switch(key){
    case 'qi-medicine-court': return a.step==='done'||n.sectBriefed;
    case 'qi-stone-ravine': return n.phase!=='unknown'||s.qiJourney.gates>=1;
    case 'qi-pass-branch': return n.pursuit!=='none';
    case 'lizhao-harbor': return s.goldenStory.teachings.includes('pill')||s.lizhao.location!=='away'||s.lizhao.cleared;
    case 'fuchao-bay': return !['none','rumor'].includes(s.lizhao.pursuit);
    case 'outer-ferry': return s.goldenStory.direction!=='none'||s.outerSea.met;
    case 'outer-ruins': return s.outerSea.met;
    case 'conclave-court': return s.outerSea.notice!==null;
    case 'conclave-vault': return s.conclave.introduced||s.conclave.depth>0;
    case 'ferry': return true;
    case 'apothecary': return a.clue||a.step!=='ferry';
    case 'forest': return ['forest','shrine','home','done'].includes(a.step);
    case 'shrine': return ['shrine','home','done'].includes(a.step);
    case 'home': return ['home','done'].includes(a.step);
    case 'market': case 'camp': case 'pass': case 'lookout': return a.road.thanked||a.road.met||a.road.stage!=='home';
    default: return a.mist.stage!=='dormant';
  }
}
