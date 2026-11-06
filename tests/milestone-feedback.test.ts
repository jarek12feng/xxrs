import { expect, it } from 'vitest';
import { createCultivator } from '../tools/cultivator-fixture';
import { milestoneFeedback } from '../src/milestone-feedback';
import { actionReceipt } from '../src/action-feedback';
it('celebrates actual foundation attainment, never a failed or repeated attempt', () => {
 const before=createCultivator('验景','wood',42), after=structuredClone(before);
 after.realm=1;
 expect(actionReceipt(before,after,{type:'break',pill:true})?.milestone?.kind).toBe('foundation');
 expect(milestoneFeedback(after,structuredClone(after))).toBeUndefined();
 after.realm=0;after.injury++;
 expect(milestoneFeedback(before,after)).toBeUndefined();
});
it('only presents a newly obtained first primary manual or relic, not compensation or upgrades',()=>{
 const before=createCultivator('验景','wood',42);before.journey.known=[];before.journey.relics.sword=0;before.journey.relics.vial=0;
 const after=structuredClone(before);after.journey.known.push('blade');
 expect(milestoneFeedback(before,after)?.item).toBe('blade');
 expect(milestoneFeedback(after,{...structuredClone(after),stones:99})).toBeUndefined();
 const relic=structuredClone(before);relic.journey.relics.vial=1;
 expect(milestoneFeedback(before,relic)?.item).toBe('vial');
 const upgrade=structuredClone(relic);upgrade.journey.relics.vial=2;
 expect(milestoneFeedback(relic,upgrade)).toBeUndefined();
});
it('separates first takeoff practice from travel mastery and does not change saved state',()=>{
 const before=createCultivator('验景','wood',42);before.realm=1;before.wayfaring.swordFlight='none';
 const after=structuredClone(before);after.wayfaring.swordFlight='practiced';
 const snapshot=JSON.stringify(after);
 expect(milestoneFeedback(before,after)?.beats[2]).toContain('安全抵达');
 expect(JSON.stringify(after)).toBe(snapshot);
 const learned=structuredClone(after);learned.wayfaring.swordFlight='learned';
 expect(milestoneFeedback(after,learned)).toBeUndefined();
 after.status='dead';expect(milestoneFeedback(before,after)).toBeUndefined();
});
it('uses saved meetings and departures without inventing attendance or replaying on reload',()=>{
 const before=createCultivator('故人','wood',42);before.social.gender='male';
 const after=structuredClone(before);after.foundationJourney.departedAt=after.month;after.foundationJourney.whereabouts='away';
 expect(milestoneFeedback(before,after)?.kind).toBe('farewell');
 expect(milestoneFeedback(after,structuredClone(after))).toBeUndefined();
 const met=structuredClone(after);met.foundationJourney.reunion=true;met.foundationJourney.whereabouts='returned';
 expect(milestoneFeedback(after,met)?.kind).toBe('reunion');
 const golden=structuredClone(before);golden.goldenStory.reunion.stage='invited';
 const arrived=structuredClone(golden);arrived.goldenStory.reunion.stage='met';
 expect(milestoneFeedback(golden,arrived)?.companion).toContain('shentinglan');
});
it('keeps deferred ceremonies quiet and uses distinct envoys only from actual attendance',()=>{
 const before=createCultivator('观礼','wood',42);before.realm=3;before.nascentSoul.emerged=true;
 const after=structuredClone(before);after.nascentSoul.celebration='deferred';
 expect(milestoneFeedback(before,after)).toBeUndefined();
 const formal=structuredClone(after);formal.nascentSoul.celebration='formal';formal.nascentSoul.guests=['衡璇院轮值使者','澄渊宗轮值使者'];
 const receipt=milestoneFeedback(after,formal)!;
 expect(receipt.kind).toBe('ceremony');expect(receipt.guests).toHaveLength(2);
 expect(new Set(receipt.guests!.map(g=>g.art)).size).toBe(2);
 expect(receipt.guests!.some(g=>g.name==='苏婉宁')).toBe(false);
 expect(milestoneFeedback(formal,structuredClone(formal))).toBeUndefined();
});
