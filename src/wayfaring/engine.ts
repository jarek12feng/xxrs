/** Pure travel module: no game state, UI, clocks, randomness or persistence. */
export type MovementMode = 'land' | 'flight' | 'sail';
export interface SpeedEffect {
  source: string;
  mode: MovementMode;
  flat?: number;
  percent?: number;
}
export interface TravelerProfile {
  realm: number;
  speeds: Partial<Record<MovementMode, number>>;
  effects: readonly SpeedEffect[];
}
export interface TravelLeg {
  from: string;
  to: string;
  mode: MovementMode;
  distance: number;
  via?: readonly string[];
  minRealm?: number;
  /** Fixed time includes preparation/tides. It is never accelerated by equipment. */
  timing: { kind: 'distance'; fixedMonths?: number } | { kind: 'fixed'; months: number };
}
export interface JourneyPlan {
  from: string;
  to: string;
  mode: MovementMode;
  path: string[];
  distance: number;
  speed: number;
  movingMonths: number;
  fixedMonths: number;
  months: number;
}
export interface JourneyRequest {
  from: string;
  to: string;
  traveler: TravelerProfile;
  mode?: MovementMode | 'auto';
}
export type JourneyQuote = { ok: true; plan: JourneyPlan } | { ok: false; error: string };
const modes: MovementMode[] = ['land','flight','sail'];
const nonnegative = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
export function effectiveSpeed(profile: TravelerProfile, mode: MovementMode): number {
  const base=profile.speeds[mode];
  if (!base || !Number.isFinite(base) || base <= 0) return 0;
  let flat=0, percent=0;
  for (const effect of profile.effects) {
    if (effect.mode !== mode) continue;
    if (![effect.flat ?? 0,effect.percent ?? 0].every(Number.isFinite)) return 0;
    flat+=effect.flat ?? 0; percent+=effect.percent ?? 0;
  }
  const speed=(base+flat)*(1+percent/100);
  return Number.isFinite(speed) && speed>0 ? speed : 0;
}
/** Register geography once; callers only provide endpoints and a read-only traveler. */
export function createTravelEngine(places: readonly string[], legs: readonly TravelLeg[]) {
  const known=new Set(places), outgoing=new Map<string,TravelLeg[]>();
  if (known.size!==places.length) throw new Error('重复旅行地点');
  for (const leg of legs) {
    const time=leg.timing.kind==='fixed'?leg.timing.months:leg.timing.fixedMonths ?? 0;
    if (!known.has(leg.from)||!known.has(leg.to)||!modes.includes(leg.mode)||!nonnegative(leg.distance)||!nonnegative(time)||!nonnegative(leg.minRealm ?? 0)||(leg.via ?? []).some(id=>!known.has(id))) throw new Error('无效旅行路线');
    const list=outgoing.get(leg.from) ?? [];
    list.push({...leg,via:leg.via ? [...leg.via] : undefined,timing:{...leg.timing}});outgoing.set(leg.from,list);
  }
  return {
    plan(request: JourneyRequest): JourneyQuote {
      const {from,to,traveler}=request;
      if (!known.has(from)||!known.has(to)) return {ok:false,error:'未知旅行地点'};
      if (!nonnegative(traveler.realm)) return {ok:false,error:'无效旅行能力'};
      const choices=request.mode && request.mode!=='auto'?[request.mode]:modes;
      let best: JourneyPlan | undefined;
      for (const mode of choices) {
        const speed=effectiveSpeed(traveler,mode);
        if (!speed) continue;
        const queue: JourneyPlan[]=[{from,to:from,mode,path:[from],distance:0,speed,movingMonths:0,fixedMonths:0,months:0}];
        const visited=new Set<string>();
        while(queue.length) {
          queue.sort((a,b)=>(a.movingMonths+a.fixedMonths)-(b.movingMonths+b.fixedMonths)||a.distance-b.distance||(a.path.join('/')<b.path.join('/')?-1:a.path.join('/')>b.path.join('/')?1:0));
          const plan=queue.shift()!;
          if(visited.has(plan.to))continue;
          visited.add(plan.to);
          if(plan.to===to) {
            plan.months=Math.ceil(plan.movingMonths+plan.fixedMonths);
            if(!best || plan.months<best.months || (plan.months===best.months && plan.movingMonths+plan.fixedMonths<best.movingMonths+best.fixedMonths))best=plan;
            break;
          }
          for(const leg of outgoing.get(plan.to) ?? []) {
            if(leg.mode!==mode || traveler.realm<(leg.minRealm ?? 0) || visited.has(leg.to))continue;
            queue.push({...plan,to:leg.to,path:[...plan.path,...(leg.via ?? []),leg.to],distance:plan.distance+leg.distance,
              movingMonths:plan.movingMonths+(leg.timing.kind==='distance'?leg.distance/speed:0),
              fixedMonths:plan.fixedMonths+(leg.timing.kind==='fixed'?leg.timing.months:leg.timing.fixedMonths ?? 0)});
          }
        }
      }
      return best?{ok:true,plan:best}:{ok:false,error:'没有符合当前通行能力的路线'};
    },
  };
}
/** A saved departure is self-contained: changes to equipment never reprice it. */
export function validJourneyPlan(value: unknown): value is JourneyPlan {
  if(!value || typeof value!=='object')return false;
  const p=value as JourneyPlan;
  return typeof p.from==='string' && typeof p.to==='string' && modes.includes(p.mode) &&
    Array.isArray(p.path) && p.path.length>0 && p.path.every(x=>typeof x==='string') &&
    p.path[0]===p.from && p.path.at(-1)===p.to && new Set(p.path).size===p.path.length &&
    [p.distance,p.speed,p.movingMonths,p.fixedMonths,p.months].every(nonnegative) && p.speed>0 &&
    Number.isSafeInteger(p.months) && p.months===Math.ceil(p.movingMonths+p.fixedMonths);
}
/** One clock loop for inland and chapter journeys. Caller owns arrival and persistence. */
export function advanceJourney<S>(input:S, port:{
  remaining:(s:S)=>number;
  consume:(s:S)=>void;
  tick:(s:S)=>S;
  interrupted:(before:S,after:S)=>unknown;
}) {
  let state=input;
  while(port.remaining(state)>0) {
    const before=state;
    state=port.tick(state);
    port.consume(state);
    if(port.interrupted(before,state))return {state,stopped:true};
  }
  return {state,stopped:false};
}
