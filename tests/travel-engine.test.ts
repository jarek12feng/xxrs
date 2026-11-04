import { SAVE_VERSION } from "../src/save-version";
import { legacyEquipment } from "./legacy-equipment";
import {expect,it} from 'vitest';
import {createTravelEngine,effectiveSpeed,validJourneyPlan,type TravelerProfile} from '../src/wayfaring/engine';
import {inlandTravel} from '../src/wayfaring/routes';
import {createGame,dispatch,migrateSave,validState} from '../src/core';
import {journeyCheckpoint} from '../tools/foundation-journey-checkpoint';
import {travelQuote} from '../src/wayfaring/rules';
const traveler:TravelerProfile={realm:1,speeds:{land:1200,flight:3600,sail:9000},effects:[]};
it('equipment effects stack by mode, after flat additions, without granting flight',()=>{
 const fast={...traveler,effects:[{source:'飞剑',mode:'flight' as const,flat:1200},{source:'御风诀',mode:'flight' as const,percent:50}]};
 expect(effectiveSpeed(fast,'flight')).toBe(7200);
 expect(effectiveSpeed(fast,'land')).toBe(1200);
 expect(effectiveSpeed({...fast,speeds:{land:1200}},'flight')).toBe(0);
 const qi={...fast,realm:0};
 expect(inlandTravel.plan({from:'home',to:'ferry',traveler:qi,mode:'flight'}).ok).toBe(false);
});
it('finds routes from endpoints; faster long trips do not round every leg separately',()=>{
 const normal=inlandTravel.plan({from:'home',to:'snow',traveler,mode:'flight'});
 const fast=inlandTravel.plan({from:'home',to:'snow',traveler:{...traveler,effects:[{source:'飞剑',mode:'flight',percent:100}]},mode:'auto'});
 expect(normal).toMatchObject({ok:true,plan:{distance:6000,months:2,path:['home','ferry','inn','snow']}});
 expect(fast).toMatchObject({ok:true,plan:{mode:'flight',months:1}});
 expect(inlandTravel.plan({from:'unknown',to:'snow',traveler}).ok).toBe(false);
});
it('chooses the fastest eligible route, excludes fixed tide time from speed bonuses',()=>{
 const engine=createTravelEngine(['a','b','c'],[
  {from:'a',to:'b',mode:'flight',distance:7200,timing:{kind:'distance',fixedMonths:2}},
  {from:'b',to:'c',mode:'flight',distance:3600,timing:{kind:'distance'}},
  {from:'a',to:'c',mode:'sail',distance:50000,timing:{kind:'fixed',months:6}},
 ]);
 expect(engine.plan({from:'a',to:'c',traveler})).toMatchObject({ok:true,plan:{mode:'flight',months:5,fixedMonths:2}});
 expect(engine.plan({from:'a',to:'c',traveler:{...traveler,effects:[{source:'御风',mode:'flight',percent:100}]}})).toMatchObject({ok:true,plan:{months:4,fixedMonths:2}});
 expect(engine.plan({from:'a',to:'c',mode:'sail',traveler:{...traveler,effects:[{source:'船',mode:'sail',percent:100}]}})).toMatchObject({ok:true,plan:{months:6}});
 expect(engine.plan({from:'c',to:'a',traveler}).ok).toBe(false);
});
it('free nearby routes remain free and do not mutate the input profile',()=>{
 const before=structuredClone(traveler);
 const engine=createTravelEngine(['a','b'],[{from:'a',to:'b',mode:'land',distance:25,timing:{kind:'fixed',months:0}}]);
 const result=engine.plan({from:'a',to:'b',traveler});
 expect(result).toMatchObject({ok:true,plan:{months:0,distance:25}});
 expect(traveler).toEqual(before);
 if(result.ok)expect(validJourneyPlan(result.plan)).toBe(true);
 expect(validJourneyPlan({})).toBe(false);
});
it('saved departure survives profile changes and reload, consuming only the remaining months',()=>{
 const s=journeyCheckpoint('male',false);s.wayfaring.swordFlight='learned';
 const plan=inlandTravel.plan({from:'home',to:'ferry',mode:'flight',traveler:{...traveler,effects:[{source:'逆风',mode:'flight',percent:-75}]}});
 if(!plan.ok)throw Error(plan.error);
 s.wayfaring.trip={from:'home',to:'ferry',mode:'flight',total:plan.plan.months,remaining:1,plan:plan.plan};
 expect(validState(s)).toBe(true);
 const restored=migrateSave(JSON.parse(JSON.stringify(s)));
 expect(travelQuote(restored,'ferry','flight')).toMatchObject({months:3,remaining:1,speed:900});
 const arrived=dispatch(restored,{id:'arrive',type:'foundationJourney',action:{kind:'travel',destination:'ferry',mode:'flight'}});
 expect(arrived.month-s.month).toBe(1);expect(arrived.foundationJourney.location).toBe('ferry');
 expect(arrived.wayfaring.trip).toBeNull();
});
it('migrates version 33 in-progress trips conservatively and rejects forged totals or future saves',()=>{
 const s=journeyCheckpoint('male',false);
 const old={...s,treasures:legacyEquipment(s),version:33,wayfaring:{...s.wayfaring,trip:{from:'home',to:'ferry',mode:'land',total:3,remaining:2}}};
 const before=structuredClone(old), migrated=migrateSave(old);
 expect(migrated.version).toBe(SAVE_VERSION);expect(migrated.wayfaring.trip?.plan.speed).toBe(1200);
 expect(old).toEqual(before);
 expect(()=>migrateSave({...old,wayfaring:{...old.wayfaring,trip:{...old.wayfaring.trip,total:1}}})).toThrow();
 expect(()=>migrateSave({...createGame('未来','wood'),version:999})).toThrow();
});
