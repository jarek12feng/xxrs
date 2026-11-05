import {expect,it} from 'vitest';
import {dispatch,migrateSave,validState} from '../src/core';
import {lizhaoDepthCheckpoint} from '../tools/lizhao-depth-checkpoint';
import {lizhaoFixture,lizhaoTick} from '../tools/lizhao-fixture';
import {runLizhao,lizhaoQuote,type LizhaoAction} from '../src/lizhao/rules';
import {lizhaoExchange} from '../src/lizhao/combat';
import {freshAssay} from '../src/lizhao/assay';
it('试炉先观察再分潮定性，误判、回港与读档保留试液，不动辅药',()=>{
 let s=lizhaoDepthCheckpoint();const initial=structuredClone(s);let serial=0;
 const act=(action:LizhaoAction)=>{const before=s,cmd={type:'lizhao' as const,id:`assay-${++serial}`,action};expect(lizhaoQuote(s,action).error).toBe('');s=dispatch(s,cmd);expect(dispatch(before,cmd)).toEqual(s);expect(dispatch(s,cmd)).toBe(s);expect(validState(s)).toBe(true);expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);};
 act({kind:'verify'});expect(s.lizhao.recipeVerified).toBe(false);expect(s.herbs).toBe(initial.herbs-2);
 act({kind:'assay',move:'bind'});expect(s.lizhao.assay).toMatchObject({phase:'cloudy',mistakes:1});
 act({kind:'assay',move:'drain'});expect(s.lizhao.assay.phase).toBe('clear');
 act({kind:'return'});expect(lizhaoQuote(s,{kind:'assay',move:'bind'}).error).not.toBe('');
 act({kind:'chamber'});act({kind:'assay',move:'bind'});
 expect(s.lizhao.recipeVerified).toBe(true);expect(s.lizhao.reagent).toBe(initial.lizhao.reagent);expect(s.month-initial.month).toBe(5);
 expect(lizhaoQuote(s,{kind:'verify'}).error).not.toBe('');
});
it('弃炉可重备；时间中断不扣料、不改变药液',()=>{
 const s=lizhaoDepthCheckpoint();let n=runLizhao(s,{kind:'verify'},'start',lizhaoTick);
 n=runLizhao(n,{kind:'assay',move:'discard'},'discard',lizhaoTick);expect(n.lizhao.assay.phase).toBe('idle');expect(n.lizhao.reagent).toBe(s.lizhao.reagent);
 const interrupted=runLizhao(n,{kind:'verify'},'interrupted',v=>({...v,status:'dead'}));
 expect(interrupted.herbs).toBe(n.herbs);expect(interrupted.lizhao.assay.phase).toBe('idle');
 expect(lizhaoQuote(n,{kind:'assay',move:'drain'}).error).not.toBe('');
});
it('旧档保留已验药理，未验证者不补经历；损坏新档拒绝',()=>{
 const s=lizhaoDepthCheckpoint();const old=structuredClone(s) as any;old.version=47;delete old.lizhao.assay;
 const snapshot=structuredClone(old);const n=migrateSave(old);expect(n.lizhao.assay).toEqual(freshAssay());expect(n.lizhao.recipeVerified).toBe(false);expect(old).toEqual(snapshot);
 old.lizhao.recipeVerified=true;expect(migrateSave(old).lizhao.recipeVerified).toBe(true);
 const bad=structuredClone(n);bad.lizhao.assay.phase='stable';expect(validState(bad)).toBe(false);expect(()=>migrateSave(bad)).toThrow();
});
it('印珠处理实际潮毒、剑借开口破枢，未装备无效且预览等于结算',()=>{
 const s=lizhaoFixture();s.lizhao.location='inner';s.lizhao.route='independent';s.lizhao.preparation='ward';s.lizhao.outerCleared=true;
 s.lizhao.duel={kind:'inner',hp:120,enemy:420,turn:0,effect:'',toxin:30};
 s.treasures.artifacts=[];const baseline=lizhaoExchange(s,'guard')!;
 s.outerSea.seal=true;s.outerSea.attuned=true;s.treasures.artifacts=['tideSeal'];const seal=lizhaoExchange(s,'guard')!;expect(seal.toxin).toBe(baseline.toxin-6);
 s.conclave.depth=2;s.conclave.attuned=true;s.treasures.artifacts=['spiritPearl'];s.lizhao.duel.turn=2;
 const pearl=lizhaoExchange(s,'discern')!;s.treasures.artifacts=[];expect(pearl.toxin).toBe(Math.max(0,lizhaoExchange(s,'discern')!.toxin-8));
 s.itemGrowth.golden.blade='attuned';s.itemGrowth.golden.heard=true;s.treasures.artifacts=['tideBlade'];s.lizhao.duel.turn=1;s.lizhao.duel.effect='guard';
 const before=structuredClone(s),blade=lizhaoExchange(s,'strike')!;expect(blade.note).toContain('沿已开的罡隙');expect(s).toEqual(before);
 const next=runLizhao(s,{kind:'move',move:'strike'},'blade-proof',lizhaoTick);expect(next.lizhao.duel!.enemy).toBe(s.lizhao.duel.enemy-blade.damage);expect(next.lizhao.duel!.toxin).toBe(blade.toxin);
});
