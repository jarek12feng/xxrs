import {dispatch,validState,type State} from '../src/core';
import {conclavePlayer} from './conclave-checkpoint';
import {conclaveExchange} from '../src/conclave/rules';
import type {Move} from '../src/combat';
export function solveBattle(start:State,goal:'speed'|'safe'|'frugal'){
 let beam=[{s:start,path:[] as Move[]}];
 const wins:typeof beam=[];
 for(let turn=0;turn<18 && beam.length;turn++){
  const next:typeof beam=[];
  for(const node of beam)for(const move of ['guard','strike','discern'] as const){
   const s=dispatch(node.s,{type:'conclave',action:{kind:'move',move,useHerbs:goal!=='frugal'},id:`p1-search-${turn}`});
   if(!validState(s))throw Error('Invalid search state');
   const path=[...node.path,move];
   if(s.conclave.wins+s.conclave.depth>start.conclave.wins+start.conclave.depth) wins.push({s,path});
   else if(s.conclave.duel)next.push({s,path});
  }
  if(goal==='speed' && wins.length)break;
  const rank=(n:typeof beam[number])=>{const d=n.s.conclave.duel!;return d.hp-d.enemy*.7+(goal==='frugal'?n.s.herbs*2:0);};
  next.sort((a,b)=>rank(b)-rank(a));const seen=new Set<string>();
  beam=next.filter(n=>{const d=n.s.conclave.duel!;const key=JSON.stringify([d.hp,d.enemy,d.effect,n.s.herbs,d.effort]);if(seen.has(key))return false;seen.add(key);return true}).slice(0,32);
 }
 const score=(n:typeof beam[number])=>{const last=n.s.conclave.victories.at(-1)!;return goal==='speed'?-last.turns:goal==='frugal'?-last.herbs*100-last.turns: -last.turns*.1 + (n.s.conclave.last.includes('气势耗尽')?-100:0);};
 // Safety compares the final exchange's actual remaining HP, not the post-battle reset.
 function remaining(n:typeof beam[number]){let s=start;for(const [i,move] of n.path.entries()){const d=s.conclave.duel!,q=conclaveExchange(s,move,goal!=='frugal')!;const hp=Math.max(0,d.hp-q.incoming+q.healing);s=dispatch(s,{type:'conclave',action:{kind:'move',move,useHerbs:goal!=='frugal'},id:`p1-replay-${i}`});if(!s.conclave.duel)return hp;}return 0;}
 const finalists=wins.map(w=>({...w,remaining:remaining(w)}));
 finalists.sort((a,b)=>goal==='safe'?b.remaining-a.remaining || a.path.length-b.path.length:score(b)-score(a));
 return finalists[0] ?? null;
}
export function p1Audit(){
 const rows=[];
 for(const main of ['spring','blade','breath'] as const){
  const p=conclavePlayer(main);p.arrive();p.work(60);p.herbs(20);const base=p.state;
  for(const prep of ['none','ward','insight'] as const){
   const prepared=prep==='none'?base:dispatch(base,{type:'conclave',action:{kind:'training',style:prep},id:`prep-${prep}`});
   const start=dispatch(prepared,{type:'conclave',action:{kind:'contest'},id:`start-${prep}`});
   for(const goal of ['speed','safe','frugal'] as const){
    const win=solveBattle(start,goal);
    rows.push({main,prep,goal,stones:base.stones-prepared.stones,months:prepared.month-base.month,win:!!win,...(win?{turns:win.path.length,herbs:win.s.conclave.victories.at(-1)!.herbs,remaining:win.remaining,path:win.path}:{})});
   }
  }
 }
 return rows;
}
if(process.argv[1]?.includes('p1-combat-audit'))console.log(JSON.stringify(p1Audit(),null,2));
