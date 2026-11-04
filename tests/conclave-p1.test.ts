import {it,expect} from 'vitest';
import {dispatch,migrateSave,validState,type State} from '../src/core';
import {conclavePlayer,chooseConclaveMove} from '../tools/conclave-checkpoint';
import {conclavePhase} from '../src/conclave/phases';
import {conclaveExchange,conclaveQuote} from '../src/conclave/rules';
import {conclaveLessons,victoryStyle} from '../src/conclave/victories';
import {goldenCombat} from '../src/golden-scene/presentation';
function ready(){const p=conclavePlayer();p.arrive();p.work(40);p.herbs(20);return p;}
function win(s:State){for(let i=0;s.conclave.duel && i<18;i++)s=dispatch(s,{type:'conclave',action:{kind:'move',move:chooseConclaveMove(s)},id:`actual-${s.conclave.wins}-${i}`});return s;}
it('可见阶段统一正确应对与报价，顾沧遥半血后不再沿用辨攻固定答案',()=>{
 const p=ready();p.act({kind:'contest'});const s=p.state;
 expect(conclavePhase(s)?.responses).toEqual(['guard','discern']);
 for(const m of ['guard','strike','discern'] as const)expect(conclaveExchange(s,m)!.correct).toBe(conclavePhase(s)!.responses.includes(m));
 const late=structuredClone(s);late.conclave.duel!.enemy=150;late.conclave.duel!.effect='guard';
 expect(conclavePhase(late)?.mode).toBe('palm');
 const held=conclaveExchange(late,'strike')!;late.conclave.duel!.effect='discern';
 expect(held.damage).toBeGreaterThan(conclaveExchange(late,'strike')!.damage);
 expect(held.incoming).toBeLessThan(conclaveExchange(late,'strike')!.incoming);
});
it('纪闻霜转短剑，程砚舟转封最常用招式，阵核半血后加快且无隐藏随机',()=>{
 const p=ready();p.act({kind:'contest'});const s=structuredClone(p.state),d=s.conclave.duel!;
 d.index=1;d.enemy=170;expect(conclavePhase(s)?.mode).toBe('quick');d.turn=1;expect(conclavePhase(s)?.mode).toBe('recover');d.turn=2;expect(conclavePhase(s)?.mode).toBe('feint');
 d.index=2;d.enemy=210;d.effect='discern';d.effort={moves:{strike:3,guard:1,discern:1},herbs:0};d.turn=5;
 expect(conclavePhase(s)?.sealed).toBe('strike');
 const before=JSON.stringify(s);conclaveExchange(s,'guard');expect(JSON.stringify(s)).toBe(before);
 d.kind='vault';d.index=1;d.enemy=200;d.turn=1;
 expect(conclavePhase(s)?.mode).toBe('surge');d.enemy=201;expect(conclavePhase(s)?.mode).toBe('gather');
});
it('是否用草由命令决定，报价、扣除和记录一致，不能提交非布尔用药设置',()=>{
 const p=ready();p.act({kind:'contest'});const s=p.state;
 const q=conclaveExchange(s,'guard')!,reserved=conclaveExchange(s,'guard',false)!;
 expect(q.healing).toBeGreaterThan(0);expect(reserved.healing).toBe(0);expect(reserved.herbs).toBe(0);
 const next=dispatch(s,{type:'conclave',action:{kind:'move',move:'guard',useHerbs:false},id:'reserve'});
 expect(next.herbs).toBe(s.herbs);expect(next.conclave.duel!.effort!.herbs).toBe(0);
 expect(next.conclave.duel!.hp).toBe(s.conclave.duel!.hp-reserved.incoming);
 expect(validState(next)).toBe(true);
 expect(dispatch(s,{type:'conclave',action:{kind:'move',move:'guard',useHerbs:'no'} as never,id:'bad'})).toBe(s);
});
it('三种备战互斥，可撤去演练而不退款，真实胜绩读档保留并在下一程兑现',()=>{
 const p=ready();const before=p.state;p.act({kind:'training',style:'ward'});
 const ward=p.state;expect(ward.stones).toBe(before.stones-12);
 p.act({kind:'training',style:'insight'});expect(p.state.conclave.preparation).toBe('insight');
 p.act({kind:'training',style:'none'});expect(p.state.conclave.preparation).toBe('none');expect(p.state.stones).toBe(ward.stones-6);
 p.act({kind:'contest'});let s=win(p.state);expect(s.conclave.wins).toBe(1);
 const first=s.conclave.victories[0]!;expect(first.turns).toBe(first.moves.guard+first.moves.strike+first.moves.discern);
 s=migrateSave(JSON.parse(JSON.stringify(s)));expect(s.conclave.victories[0]).toEqual(first);
 s=dispatch(s,{type:'conclave',action:{kind:'contest'},id:'second'});s=win(s);expect(s.conclave.wins).toBe(2);
 s=dispatch(s,{type:'conclave',action:{kind:'route',route:'shelter'},id:'route'});
 const lessons=conclaveLessons(s);expect(conclaveQuote(s,{kind:'prepare'}).herbs).toBe(2-lessons.herbsSaved);
 s=dispatch(s,{type:'conclave',action:{kind:'prepare'},id:'pack'});s=dispatch(s,{type:'conclave',action:{kind:'enter'},id:'enter'});s=dispatch(s,{type:'conclave',action:{kind:'fight'},id:'fight'});
 expect(s.conclave.duel!.hp).toBe(goldenCombat(s,'conclave')!.playerMax);
 expect(lessons.shelterHp).toBe(victoryStyle(first)==='steady'?4:0);
 expect(validState(s)).toBe(true);
 const bad=structuredClone(s);bad.conclave.victories.push(first);expect(validState(bad)).toBe(false);
});
it('v36迁移保留破境与战斗现场，不编造旧打法；v37损坏记录与未来版本拒绝',()=>{
 const p=ready();p.act({kind:'contest'});p.act({kind:'move',move:'guard'});
 const current=p.state;const old=JSON.parse(JSON.stringify(current));old.version=36;delete old.conclave.victories;delete old.conclave.duel.effort;
 const copy=JSON.stringify(old),n=migrateSave(old);
 expect(n.version).toBe(37);expect(n.conclave.duel!.hp).toBe(current.conclave.duel!.hp);expect(n.conclave.duel!.effort).toBeNull();expect(n.conclave.victories).toEqual([]);expect(JSON.stringify(old)).toBe(copy);
 const corrupt=structuredClone(current);corrupt.conclave.duel!.effort!.moves.strike=19;expect(()=>migrateSave(corrupt)).toThrow();
 expect(()=>migrateSave({...n,version:38})).toThrow();
});
