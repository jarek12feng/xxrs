import { it, expect } from 'vitest';
import { conclavePlayer } from '../tools/conclave-checkpoint';
import { battleSignal } from '../src/conclave/battle-feedback';
import { conclaveExchange } from '../src/conclave/rules';
import { dispatch, migrateSave, validState } from '../src/core';
it('敌方来势随保存的上一合变化，读取不改变规则状态',()=>{
 const p=conclavePlayer();p.arrive();p.work(30);p.herbs(10);p.act({kind:'contest'});
 const s=p.state,before=JSON.stringify(s);
 expect(battleSignal(s)?.title).toBe('护势未散');
 expect(JSON.stringify(s)).toBe(before);
 const next=dispatch(s,{type:'conclave',action:{kind:'move',move:'discern'},id:'signal-read'});
 expect(battleSignal(migrateSave(JSON.parse(JSON.stringify(next))))?.title).toBe('印隙已明');
});
it('败退保存真实末合结算、两种调整以及既有重试代价',()=>{
 const p=conclavePlayer();p.arrive();p.act({kind:'contest'});
 let s=p.state, n=0;
 while(s.conclave.duel){
  const quote=conclaveExchange(s,'strike')!;
  const next=dispatch(s,{type:'conclave',action:{kind:'move',move:'strike'},id:`failure-${++n}`});
  if(!next.conclave.duel){
   expect(next.conclave.wins).toBe(0);
   expect(next.conclave.last).toContain(`削去气势 ${quote.damage}、承受 ${quote.incoming}`);
   expect(next.conclave.last).toContain('下次调整：');
   expect(next.conclave.last).toContain('也可');
   expect(next.conclave.retryAt).toBe(next.month+6);
   expect(validState(next)).toBe(true);
   expect(migrateSave(JSON.parse(JSON.stringify(next))).conclave.last).toBe(next.conclave.last);
  }
  s=next;
  expect(n).toBeLessThanOrEqual(18);
 }
});
