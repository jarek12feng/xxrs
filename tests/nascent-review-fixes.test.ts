import { beforeAll, expect, it } from 'vitest';
import { finishGoldenCompletion, goldenLateCheckpoint, goldenCompletionPlayer } from '../tools/golden-completion-checkpoint';
import { nascentInteractions } from '../src/nascent-soul/view';
import { nascentQuote, nascentPromises, nascentStepPreview } from '../src/nascent-soul/rules';
import { migrateSave, validState, type State } from '../src/core';
import { channelingMoves } from '../src/nascent-soul/channeling';
let ready: State, emerged: State, discussed: State;
beforeAll(()=>{const done=finishGoldenCompletion(goldenLateCheckpoint(),'self');ready=done.checkpoints['nascent-ready']!;emerged=done.checkpoints.nascent!;discussed=finishGoldenCompletion(goldenLateCheckpoint(),'self','marry').checkpoints['covenant-prepared']!;},120000);
it('暂缓大典后仍可在古渡办理，正式礼仅结算一次',()=>{
 const p=goldenCompletionPlayer(emerged);p.nascent({kind:'emerge'});p.nascent({kind:'celebrate',choice:'deferred',office:'declined'});
 expect(nascentQuote(p.state,{kind:'celebrate',choice:'formal',office:'declined'}).error).toBe('');
 p.nascent({kind:'celebrate',choice:'formal',office:'declined'});
 expect(nascentQuote(p.state,{kind:'celebrate',choice:'simple',office:'accepted'}).error).not.toBe('');
});
it('未许寻人承诺不出现旧约必办入口',()=>{
 expect(ready.foundationJourney.sister).toBe('none');
 expect(nascentInteractions(ready).some(r=>r.action.kind==='commit'&&r.action.topic==='promise')).toBe(false);
});

it('暂缓结契恢复商议并保留已选信物，礼后不能再次暂缓或结算',()=>{
 const p=goldenCompletionPlayer(discussed),c=structuredClone(discussed.nascentSoul.covenant);
 p.nascent({kind:'ceremony',choice:'defer'});
 expect(migrateSave(JSON.parse(JSON.stringify(p.state)))?.nascentSoul.covenant).toEqual(c);
 p.nascent({kind:'ceremony',choice:'discuss'});
 expect(p.state.nascentSoul.covenant).toEqual(c);
 p.nascent({kind:'ceremony',choice:'witness'});p.nascent({kind:'ceremony',choice:'meal'});
 expect(p.state.foundationJourney.bond).toBe('covenant');
 expect(nascentQuote(p.state,{kind:'ceremony',choice:'defer'}).error).not.toBe('');
 expect(nascentQuote(p.state,{kind:'ceremony',choice:'meal'}).error).not.toBe('');
});
it('元婴出关后可继续真实旧约，跨场与失联仍拒绝',()=>{
 const s=structuredClone(emerged);
 s.social=structuredClone(discussed.social);s.foundationJourney.bond=discussed.foundationJourney.bond;
 s.nascentSoul.covenant=structuredClone(discussed.nascentSoul.covenant);s.nascentSoul.ceremony='deferred';
 s.nascentSoul.contactedAt=s.month;
 const p=goldenCompletionPlayer(s);p.nascent({kind:'emerge'});p.nascent({kind:'ceremony',choice:'discuss'});
 expect(p.state.nascentSoul.ceremony).toBe('discussed');
 const lost=structuredClone(s);lost.foundationJourney.whereabouts='missing';
 expect(nascentQuote(lost,{kind:'ceremony',choice:'discuss'}).error).not.toBe('');
 const away=structuredClone(s);away.outerSea.location='home';
 expect(nascentQuote(away,{kind:'ceremony',choice:'discuss'}).error).not.toBe('');
});
it('无承诺的空栏可留空保存并叩关，真实未竟承诺仍拦截',()=>{
 const s=structuredClone(ready);
 for(const topic of Object.keys(nascentPromises(s)) as (keyof ReturnType<typeof nascentPromises>)[])if(!nascentPromises(s)[topic])s.nascentSoul.commitments[topic]='none';
 expect(validState(s)).toBe(true);
 const p=goldenCompletionPlayer(s);p.nascent({kind:'begin'});expect(validState(p.state)).toBe(true);
 const promised=structuredClone(s);promised.foundationJourney.sister='promised';promised.nascentSoul.commitments.promise='none';
 expect(nascentQuote(promised,{kind:'begin'}).error).toContain('托付');
 expect(nascentInteractions(promised).filter(r=>r.action.kind==='commit'&&r.action.topic==='promise')).toHaveLength(2);
 promised.foundationJourney.sister='reunited';expect(nascentQuote(promised,{kind:'begin'}).error).toBe('');
});
it('三段没有跨准备固定通路，危险选项仍给出真实报价',()=>{
 let common=new Set(Array.from({length:8},(_,i)=>i));
 for(const land of ['independent','shared'] as const)for(const method of ['stillness','continuity'] as const)for(const protection of ['array','friends'] as const)for(const strategy of ['balanced','flow','spirit'] as const){
  const base=structuredClone(ready);Object.assign(base.nascentSoul,{land,protection,strategy,reviewed:false});base.nascentSoul.thunder.method=method;
  const wins:number[]=[];
  for(let mask=0;mask<8;mask++){
   const p=goldenCompletionPlayer(base);p.nascent({kind:'begin'});
   const moves=[channelingMoves[0][mask&1]!,channelingMoves[1][(mask>>1)&1]!,channelingMoves[2][(mask>>2)&1]!];
   for(const move of moves){if(!p.state.nascentSoul.attempt)break;const preview=nascentStepPreview(p.state,move)!;
    expect(nascentInteractions(p.state).some(r=>r.action.kind==='step'&&r.action.move===move)).toBe(true);
    const old=p.state.nascentSoul.attempt!.stability;p.nascent({kind:'step',move});
    if(p.state.nascentSoul.attempt)expect(p.state.nascentSoul.attempt.stability).toBe(Math.max(0,old-preview.loss));
   }
   if(p.state.nascentSoul.thunder.battle)wins.push(mask);
  }
  expect(wins.length,JSON.stringify({land,method,protection,strategy})).toBeGreaterThan(0);
  common=new Set([...common].filter(i=>wins.includes(i)));
 }
 expect([...common]).toEqual([]);
},30000);
