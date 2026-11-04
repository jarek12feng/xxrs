import { dispatch, validState, type State } from '../src/core';
import { conclavePlayer } from './conclave-checkpoint';
import { conclaveFoe, conclaveExchange } from '../src/conclave/rules';
import type { Move } from '../src/combat';
function search(start:State) {
 let beam=[{state:start,path:[] as Move[]}];
 for(let turn=0;turn<18;turn++) {
  const next:typeof beam=[];
  for(const node of beam)for(const move of ['guard','strike','discern'] as const){
   const n=dispatch(node.state,{type:'conclave',action:{kind:'move',move},id:`search-${turn}`});
   if(!validState(n))throw Error('Invalid search');
   const path=[...node.path,move];
   if(n.conclave.depth>start.conclave.depth)return path;
   if(n.conclave.duel)next.push({state:n,path});
  }
  const score=(n:typeof beam[number])=>n.state.conclave.duel!.hp-n.state.conclave.duel!.enemy*.8+n.state.herbs*.1;
  next.sort((a,b)=>score(b)-score(a));
  const seen=new Set<string>();beam=next.filter(n=>{const d=n.state.conclave.duel!;const k=`${d.hp}/${d.enemy}/${d.effect}/${n.state.herbs}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,80);
 }
 return [];
}
export function auditChallengePayoff(){
 const rows=[];
 for(const main of ['spring','blade','breath'] as const){
  const p=conclavePlayer(main);p.arrive();p.work(60);p.herbs(30);
  p.act({kind:'training',style:'ward'});
  for(const encounter of ['gu','ji','cheng','outer','core'] as const){
   if(encounter==='ji'||encounter==='cheng')p.battle('contest');
   if(encounter==='outer'){p.act({kind:'route',route:'shelter'});p.act({kind:'prepare'});p.act({kind:'enter'});}
   if(encounter==='core'){p.battle('fight');p.work(30);p.act({kind:'attune'});p.act({kind:'prepare'});p.act({kind:'enter'});}
   const base=dispatch(p.state,{type:'conclave',action:{kind:encounter==='outer'||encounter==='core'?'fight':'contest'},id:`audit-start-${encounter}`});
   const searched=encounter==='core'?search(base):[];
   for(const strategy of ['search','strike','guard','discern','pattern','observed'] as const){
    if(strategy==='search' && encounter!=='core')continue;
    let s=base;
    const startHerbs=s.herbs;
    let serial=0;
    while(s.conclave.duel){
     const d=s.conclave.duel;
     let move:Move=strategy==='observed'?'guard':strategy==='pattern'||strategy==='search'?conclaveFoe(s).pattern[d.turn%3]!:strategy;
     if(strategy==='search')move=searched[serial]??conclaveFoe(s).pattern[d.turn%3]!;
     if(strategy==='observed') {
      if(encounter==='gu') move=d.effect==='discern'?'strike':'discern';
      else if(encounter==='ji') move=d.turn%2===0?'discern':'strike';
      else if(encounter==='cheng') move=d.effect==='strike'?'guard':'strike';
      else move=d.turn%3===2?'guard':d.effect==='guard'?'strike':'discern';
     }
     const quote=conclaveExchange(s,move)!;
     const n=dispatch(s,{type:'conclave',action:{kind:'move',move},id:`audit-turn-${++serial}`});
     if(n===s||!validState(n))throw Error('Invalid challenge audit');
     s=n;
     if(!s.conclave.duel)rows.push({main,encounter,strategy,win:s.conclave.wins+s.conclave.depth>base.conclave.wins+base.conclave.depth,turns:serial,remaining:Math.max(0,d.hp-quote.incoming+quote.healing),herbs:startHerbs-s.herbs,...(strategy==='search'&&encounter==='core'?{path:searched}:{})});
    }
   }
  }
 }
 return rows;
}
console.log(JSON.stringify(auditChallengePayoff(),null,2));
