import { beforeAll, expect, it } from 'vitest';
import { createGame, dispatch, migrateSave, validState, type State } from '../src/core';
import { finishGoldenCompletion, goldenLateCheckpoint } from '../tools/golden-completion-checkpoint';
import { deathView, mortalWarning } from '../src/mortality';
import { lifeReview } from '../src/life-review';
import { gameAudioScene } from '../src/audio-scene';
import { seaExchange } from '../src/outer-sea/rules';
import { lizhaoExchange } from '../src/lizhao/combat';
import { thunderExchange } from '../src/nascent-soul/thunder';
import { outerSeaCheckpoint } from '../tools/outer-sea-checkpoint';
import { SAVE_VERSION } from '../src/save-version';
let stages: Record<string,State>;
beforeAll(() => { stages = finishGoldenCompletion(goldenLateCheckpoint()).checkpoints; });
function copy(key:string) { return structuredClone(stages[key]!); }
function terminal(before:State, after:State, cause:string) {
  expect(after.status).toBe('dead');
  expect(after.death?.cause).toBe(cause);
  expect(after.age).toBe(before.age);
  expect(after.realm).toBe(before.realm);
  expect(validState(after)).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(after)))).toEqual(after);
  expect(dispatch(after,{type:'advance',activity:'rest',months:12,id:'dead-rest'})).toBe(after);
  expect(dispatch(after,{type:'nascentSoul',action:{kind:'recover'},id:'dead-recover'})).toBe(after);
  expect(dispatch(after,{type:'outerSea',action:{kind:'withdraw'},id:'dead-withdraw'})).toBe(after);
  expect(gameAudioScene(after,'world','青嶂关').music).toBe(deathView(after).music);
}
it('离照内层致命承伤、预警、死亡保存与禁行动一致，未发药材',()=>{
 const s=copy('lizhao-battle');s.lizhao.duel!.hp=1;s.herbs=0;
 expect(validState(s)).toBe(true);
 const p=lizhaoExchange(s,'strike')!;
 expect(mortalWarning(s.lizhao.duel!,p,18,p.toxin>=100)).toContain('致命');
 const c={type:'lizhao',action:{kind:'move',move:'strike'},id:'fatal-lizhao'} as const;
 const n=dispatch(s,c); terminal(s,n,'lizhao');
 expect(n.lizhao.reagent).toBe(s.lizhao.reagent);
 expect(n.lizhao.cleared).toBe(false);
 expect(dispatch(s,c)).toEqual(n);expect(dispatch(n,c)).toBe(n);
});
it('内层毒满也可陨落，外层练习则仍然伤退',()=>{
 const s=copy('lizhao-battle');s.lizhao.duel!.hp=200;s.lizhao.duel!.toxin=99;s.lizhao.preparation='ward';
 const p=lizhaoExchange(s,'strike')!;expect(p.toxin).toBeGreaterThanOrEqual(100);
 const n=dispatch(s,{type:'lizhao',action:{kind:'move',move:'strike'},id:'fatal-poison'});terminal(s,n,'lizhao');
 const outer=copy('lizhao-battle');outer.lizhao.outerCleared=false;outer.lizhao.location='outer';outer.lizhao.duel!.kind='outer';outer.lizhao.duel!.hp=1;outer.herbs=0;
 const safe=dispatch(outer,{type:'lizhao',action:{kind:'move',move:'strike'},id:'safe-outer'});
 expect(safe.status).toBe('alive');expect(safe.lizhao.location).toBe('harbor');expect(safe.death).toBeNull();
});
it('外海内府战死不发第二件宝物，主动撤离可保命',()=>{
 const s=outerSeaCheckpoint();s.outerSea.met=true;s.outerSea.pact='share';s.outerSea.cleared=1;s.outerSea.reward='seal';s.outerSea.seal=true;s.outerSea.manual=false;s.outerSea.method='none';s.outerSea.location='ruins';s.outerSea.prepared=true;s.herbs=0;
 s.outerSea.duel={depth:2,hp:1,enemy:270,turn:0,effect:''};
 expect(validState(s)).toBe(true);
 expect(mortalWarning(s.outerSea.duel,seaExchange(s,'strike')!,16)).toContain('致命');
 const n=dispatch(s,{type:'outerSea',action:{kind:'move',move:'strike'},id:'fatal-sea'});terminal(s,n,'sea');
 expect(n.outerSea.cleared).toBe(1);expect(n.outerSea.manual).toBe(false);
 const escape=dispatch(s,{type:'outerSea',action:{kind:'withdraw'},id:'sea-escape'});
 expect(escape.status).toBe('alive');expect(escape.outerSea.location).toBe('ferry');expect(validState(escape)).toBe(true);
});
it('正式雷劫同归于尽先判陨落，不加寿不晋升；主动散功与试雷保留退路',()=>{
 const s=copy('thunder-start');s.nascentSoul.thunder.battle!.hp=1;s.nascentSoul.thunder.battle!.enemy=1;s.herbs=0;
 const p=thunderExchange(s,'strike',false)!;
 expect(mortalWarning(s.nascentSoul.thunder.battle!,p,12)).toContain('致命');
 const n=dispatch(s,{type:'nascentSoul',action:{kind:'thunderMove',move:'strike',useHerbs:false},id:'fatal-thunder'});terminal(s,n,'tribulation');
 expect(n.limit).toBe(s.limit);expect(n.nascentSoul.thunder.cleared).toBe(false);
 const escape=dispatch(s,{type:'nascentSoul',action:{kind:'withdraw'},id:'thunder-escape'});expect(escape.status).toBe('alive');expect(validState(escape)).toBe(true);
 const practice=copy('thunder-start');practice.nascentSoul.thunder.battle!.kind='practice';practice.nascentSoul.thunder.battle!.hp=1;practice.herbs=0;
 const safe=dispatch(practice,{type:'nascentSoul',action:{kind:'thunderMove',move:'strike'},id:'practice-fail'});expect(safe.status).toBe('alive');expect(safe.nascentSoul.thunder.battle).toBeNull();
});
it('寿尽当月不发收益，记录自然终点；新建不继承死亡与旧成就',()=>{
 const s=copy('late');s.age=s.limit-1;
 const n=dispatch(s,{type:'advance',activity:'work',months:12,id:'last-month'});
 expect(n.status).toBe('dead');expect(n.death?.cause).toBe('lifespan');expect(n.stones).toBe(s.stones);expect(n.age).toBe(s.limit);expect(validState(n)).toBe(true);
 const fresh=createGame('新旅人','wood');expect(fresh.death).toBeNull();expect(lifeReview(fresh).records.join()).not.toContain('金丹');
});
it('v56保守迁移，不编造死因；未来版本和伪造死亡元数据拒绝',()=>{
 const old=JSON.parse(JSON.stringify(copy('late')));old.version=56;delete old.death;
 const n=migrateSave(old);expect(n.version).toBe(SAVE_VERSION);expect(n.death).toBeNull();expect(old.version).toBe(56);
 const dead={...old,status:'dead',result:'旧卷原文'};const restored=migrateSave(dead);expect(restored.death).toBeNull();expect(deathView(restored).text).toBe('旧卷原文');
 expect(()=>migrateSave({...n,version:SAVE_VERSION+1})).toThrow();
 expect(validState({...n,death:{cause:'sea',month:n.month,age:n.age,realm:n.realm}})).toBe(false);
 expect(validState({...n,status:'dead',death:{cause:'sea',month:n.month-1,age:n.age,realm:n.realm}})).toBe(false);
});
it('高境界履历不再误写尚未筑基，机缘和遗憾仅据真实已知事实',()=>{
 for(const key of ['late','nascent']) { const s=copy(key);const r=lifeReview(s);expect(r.records.join()).not.toContain('尚未筑基');expect(r.records.join()).toContain('金丹'); }
 expect(lifeReview(copy('nascent')).records.join()).toContain('金丹化婴');
 const fresh=createGame('初识','wood');const text=JSON.stringify(lifeReview(fresh));expect(text).not.toContain('苏婉宁独立凝丹');expect(text).not.toContain('结契礼');
});
it('伏潮湾夺药交锋致命，不误写寿尽；历史道侣判断不凭救援目标推定',()=>{
 const s=copy('lizhao-verified');s.lizhao.location='bay';s.lizhao.allocation='seize';s.lizhao.pursuit='confront';s.lizhao.response='ambush';s.herbs=0;
 s.lizhao.duel={kind:'han',hp:1,enemy:500,turn:3,effect:'',toxin:0};
 expect(validState(s)).toBe(true);
 const n=dispatch(s,{type:'lizhao',action:{kind:'move',move:'strike'},id:'fatal-han'});terminal(s,n,'duel');
 expect(n.result).not.toContain('寿元已尽');expect(n.lizhao.reagent).toBe(s.lizhao.reagent);
 n.foundationJourney.bond='none';n.foundationJourney.target='companion';n.foundationJourney.rescue=4;
 expect(lifeReview(n).records.join()).not.toContain('与道侣内外接应');
});
