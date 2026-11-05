import { createCultivator as createGame } from "../tools/cultivator-fixture";
import {expect,it} from 'vitest';
import {dispatch} from "../src/core";
import {routeNodes} from '../src/landmarks';
import {knowsInland,knowsLandmark} from '../src/wayfaring/discovery';
import {journeyCheckpoint} from '../tools/foundation-journey-checkpoint';
import {goldenLateCheckpoint} from '../tools/golden-completion-checkpoint';

it('new map does not disclose secret locations or later realm routes',()=>{
 const s=createGame('问路','wood'), before=structuredClone(s);
 expect(routeNodes(s).map(n=>n.key)).toEqual(['ferry']);
 for(const id of ['pact','stele','snow'] as const) expect(knowsInland(s,id)).toBe(false);
 expect(s).toEqual(before);
});
it('the first ferry visit supplies the inland chart, not the dispute route',()=>{
 const s=journeyCheckpoint();
 expect(knowsInland(s,'snow')).toBe(false);
 const next=dispatch(s,{id:'discover-ferry',type:'foundationJourney',action:{kind:'travel',destination:'ferry'}});
 expect(next.foundationJourney.ferry).toBeGreaterThan(0);
 expect(next.foundationJourney.last).toContain('随身路图');
 expect(knowsInland(next,'snow')).toBe(true);
 expect(knowsInland(next,'stele')).toBe(false);
});
it('late realm alone does not reveal a secret or pursuit; saved clues do',()=>{
 const s=goldenLateCheckpoint();
 s.goldenStory.teachings=[];s.lizhao.location='away';s.lizhao.cleared=false;
 expect(knowsLandmark(s,'lizhao-harbor')).toBe(false);
 s.goldenStory.teachings.push('pill');
 expect(knowsLandmark(s,'lizhao-harbor')).toBe(true);
 s.lizhao.pursuit='rumor';expect(knowsLandmark(s,'fuchao-bay')).toBe(false);
 s.lizhao.pursuit='warned';expect(knowsLandmark(s,'fuchao-bay')).toBe(true);
 s.realm=3;expect(knowsLandmark(s,'lizhao-harbor')).toBe(true);
});
