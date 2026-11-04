import { it,expect } from 'vitest';
import { conclavePlayer } from '../tools/conclave-checkpoint';
import { conclaveExchange } from '../src/conclave/rules';
import { conclaveTactics } from '../src/conclave/tactics';
import { dispatch, migrateSave } from '../src/core';
it('顾沧遥的辨后破守是可读、可保存的真实收益',()=>{
 const p=conclavePlayer();p.arrive();p.work(30);p.herbs(10);p.act({kind:'contest'});
 const s=p.state, before=JSON.stringify(s), closed=conclaveExchange(s,'strike')!;
 expect(conclaveTactics(s,'strike').cue).toContain('护势未散');
 const n=dispatch(s,{type:'conclave',action:{kind:'move',move:'discern'},id:'read'});
 const saved=migrateSave(JSON.parse(JSON.stringify(n)));
 expect(conclaveTactics(saved,'strike').cue).toContain('印隙');
 expect(conclaveExchange(saved,'strike')!.damage).toBeGreaterThan(closed.damage);
 expect(JSON.stringify(s)).toBe(before);
});
it('纪闻霜蓄势有打断与辨后反击两种准备，会谷训练改变连招',()=>{
 const p=conclavePlayer();p.arrive();p.work(50);p.herbs(20);p.battle('contest');p.act({kind:'contest'});
 const s=p.state;
 const read=dispatch(s,{type:'conclave',action:{kind:'move',move:'discern'},id:'read'});
 const press=dispatch(s,{type:'conclave',action:{kind:'move',move:'strike'},id:'press'});
 expect(conclaveExchange(read,'strike')!.damage).toBeGreaterThan(conclaveExchange(press,'strike')!.damage);
 expect(conclaveExchange(press,'guard')!.incoming).toBeLessThan(conclaveExchange(press,'strike')!.incoming);
 const trained={...read,conclave:{...read.conclave,preparation:'insight' as const}};
 expect(conclaveExchange(trained,'strike')!.damage-conclaveExchange(read,'strike')!.damage).toBe(8);
});
