import {routeNodes} from '../src/landmarks';
import {beforeAll,expect,it} from 'vitest';
import {dispatch,migrateSave,validState,type State} from '../src/core';
import {goldenLateCheckpoint} from '../tools/golden-completion-checkpoint';
import {freshGoldenStory} from '../src/golden-story/state';
import {freshLizhao} from '../src/lizhao/state';
import {freshNascentSoul} from '../src/nascent-soul/state';
import {SAVE_VERSION} from '../src/save-version';
import {storyRoute} from '../src/wayfaring/story-routes';
let late:State;
beforeAll(()=>{late=goldenLateCheckpoint();});
it('v38 preserves earned Golden history without inventing new scenes or rewards',()=>{
 const {goldenStory:_a,lizhao:_b,nascentSoul:_c,...history}=structuredClone(late);
 const old={...history,version:38};const snapshot=JSON.stringify(old);const next=migrateSave(old);
 expect(next.version).toBe(SAVE_VERSION);expect(validState(next)).toBe(true);
 expect(next.conclave).toEqual(late.conclave);expect(next.outerSea).toEqual(late.outerSea);
 expect(next.goldenStory).toEqual(freshGoldenStory());expect(next.lizhao).toEqual(freshLizhao());expect(next.nascentSoul).toEqual(freshNascentSoul());expect(JSON.stringify(old)).toBe(snapshot);
 expect(()=>migrateSave({...old,version:SAVE_VERSION+1})).toThrow();
});
it('resumes remaining Lizhao travel months and keeps both direction quotes aligned',()=>{
 const s=structuredClone(late);s.wayfaring.passage={route:'lizhao:visit',total:6,remaining:3};
 expect(validState(s)).toBe(true);const restored=migrateSave(JSON.parse(JSON.stringify(s)));
 const route=storyRoute(restored,{type:'lizhao',action:{kind:'visit'}})!;expect(route.mode).toBe('sail');expect(route.months).toBe(3);
 const arrived=dispatch(restored,{id:'resume-lizhao',type:'lizhao',action:{kind:'visit'}});
 expect(arrived.month-s.month).toBe(3);expect(arrived.lizhao.location).toBe('harbor');expect(arrived.wayfaring.passage).toBeNull();expect(validState(arrived)).toBe(true);
 arrived.wayfaring.passage={route:'lizhao:leave',total:6,remaining:4};expect(validState(arrived)).toBe(true);
 const stopped=dispatch(arrived,{id:'cancel-lizhao',type:'wayfaring',action:{kind:'cancel'}});
 expect(stopped.wayfaring.passage).toBeNull();expect(stopped.lizhao.location).toBe('harbor');expect(stopped.month).toBe(arrived.month);expect(validState(stopped)).toBe(true);
});
it('rejects cross-site exploration and invalid completed-stage history',()=>{
 const s=structuredClone(late);s.lizhao.location='harbor';s.outerSea.location='home';expect(validState(s)).toBe(false);
 const t=structuredClone(late);t.conclave.stage=3;t.outerSea.cultivation=900;expect(validState(t)).toBe(false);
});

it('maps preserve learned sea landmarks after ascension and offer the real Lizhao return route',()=>{
 const s=structuredClone(late);s.lizhao.location='harbor';
 const ferry=routeNodes(s).find(n=>n.key==='outer-ferry')!;
 expect(ferry.intent).toEqual({type:'lizhao',action:{kind:'leave'}});
 const back=storyRoute(s,ferry.intent!)!;
 expect(back.from).toBe('harbor');expect(back.to).toBe('away');
 expect(back.note).toContain('返回外海古渡');expect(back.months).toBe(6);
 s.realm=3;s.lizhao.location='away';
 const before=structuredClone(s),nodes=routeNodes(s);
 for(const key of ['conclave-court','conclave-vault']) {
  const n=nodes.find(n=>n.key===key)!;expect(n).toBeDefined();
  expect(n.active).toBe(false);expect(n.intent).toBeUndefined();
 }
 expect(nodes.find(n=>n.key==='outer-ferry')!.condition).toContain('潮隙');
 expect(s).toEqual(before);
});
