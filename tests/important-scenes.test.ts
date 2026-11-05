import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import {createApp, h, nextTick, shallowRef} from 'vue';
import {afterEach,beforeAll,expect,it,vi} from 'vitest';
import {dispatch,migrateSave,validState,type State,type Intent} from "../src/core";
import {goldenLateCheckpoint,finishGoldenCompletion} from '../tools/golden-completion-checkpoint';
import {nascentQuote} from '../src/nascent-soul/rules';
import {freshCovenant} from '../src/nascent-soul/covenant';
import CovenantScene from '../src/nascent-soul/CovenantScene.vue';
let checkpoints:Record<string,State>;
beforeAll(()=>{checkpoints=finishGoldenCompletion(goldenLateCheckpoint(),'self','marry').checkpoints;});
let clean=()=>{};afterEach(()=>clean());
it('ceremony requires an actual shared plan and keeps it through save restoration',()=>{
 const s=checkpoints['covenant-discussed']!;
 expect(nascentQuote(s,{kind:'ceremony',choice:'witness'}).error).not.toBe('');
 expect(dispatch(s,{id:'skip-plan',type:'nascentSoul',action:{kind:'ceremony',choice:'witness'}})).toBe(s);
 const prepared=checkpoints['covenant-prepared']!,married=checkpoints['covenant-married']!;
 expect(prepared.nascentSoul.covenant).toMatchObject({form:'friends',token:'map',promise:'return'});
 expect(married.foundationJourney.bond).toBe('covenant');
 expect(migrateSave(JSON.parse(JSON.stringify(married)))).toEqual(married);
 expect(validState(married)).toBe(true);
 expect(dispatch(married,{id:'repeat-wedding',type:'nascentSoul',action:{kind:'ceremony',choice:'meal'}})).toBe(married);
});
it('private vows alter the ceremony and grant no cultivation or wealth',()=>{
 let s=structuredClone(checkpoints['covenant-discussed']!);
 const before={qi:s.outerSea.cultivation,stones:s.stones,month:s.month};
 for(const action of [
 {kind:'covenant',topic:'form',choice:'quiet'},
 {kind:'covenant',topic:'token',choice:'cord'},
 {kind:'covenant',topic:'promise',choice:'letters'},
 {kind:'ceremony',choice:'witness'},
 {kind:'ceremony',choice:'meal'},
 ] as const)s=dispatch(s,{id:JSON.stringify(action),type:'nascentSoul',action});
 expect(s.nascentSoul.last).toContain('素绳');expect(s.nascentSoul.last).toContain('信驿');
 expect(s.nascentSoul.covenant.witnesses).toEqual([]);
 expect({qi:s.outerSea.cultivation,stones:s.stones,month:s.month}).toEqual(before);
});
it('a missing partner cannot be invented for preparations',()=>{
 const s=structuredClone(checkpoints['covenant-discussed']!);s.foundationJourney.whereabouts='missing';
 expect(nascentQuote(s,{kind:'covenant',topic:'token',choice:'cord'}).error).not.toBe('');
});
it('v41 preserves old teachings and vows without inventing performance choices',()=>{
 for(const initial of [createGame('迁移','wood'),checkpoints['covenant-married']!]){
  const old=structuredClone(initial) as any;old.version=41;delete old.goldenStory.practice;delete old.goldenStory.teachingPracticeResults;delete old.nascentSoul.covenant;
  const before=JSON.stringify(old);const s=migrateSave(old);
  expect(s.goldenStory.practice).toBeNull();expect(s.goldenStory.teachingPracticeResults).toEqual([]);
  expect(s.goldenStory.teachings).toEqual(initial.goldenStory.teachings);
  expect(s.nascentSoul.covenant).toEqual(freshCovenant());expect(s.nascentSoul.ceremony).toBe(initial.nascentSoul.ceremony);
  expect(JSON.stringify(old)).toBe(before);expect(validState(s)).toBe(true);
 }
});
it('courtyard objects preview locally; only successful commands settle a vow',async()=>{
 const state=shallowRef(structuredClone(checkpoints['covenant-discussed']!));
 const act=vi.fn((intent:Intent)=>{state.value=dispatch(state.value,{...intent,id:JSON.stringify(intent)});});
 const host=document.body.appendChild(document.createElement('div'));
 const app=createApp({render:()=>h(CovenantScene,{game:state.value,busy:false,onAct:act})});app.mount(host);clean=()=>{app.unmount();host.remove();};
 const old=structuredClone(state.value);
 (host.querySelector('[data-hotspot="lantern"]') as HTMLButtonElement).click();await nextTick();
 expect(state.value).toEqual(old);expect(host.querySelector('.covenant-partner')).not.toBeNull();
 const choose=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('只留两盏灯'))!;choose.click();await nextTick();
 expect(state.value.nascentSoul.covenant.form).toBe('quiet');expect(validState(state.value)).toBe(true);
 expect(host.textContent).toContain('不必把古渡都惊动');
});
