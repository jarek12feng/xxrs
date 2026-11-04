/** Updated public-command audit. Original review/balance-audit.* remains untouched. */
import { writeFileSync } from 'node:fs';
import { goldenLateCheckpoint, finishGoldenCompletion, goldenCompletionPlayer } from '../../../tools/golden-completion-checkpoint';
import { chooseThunderMove } from '../../../tools/nascent-thunder-policy';
import { chooseChannelingMove } from '../../../tools/nascent-channeling-policy';
import { nascentPromises, nascentStepPreview, type NascentAction } from '../../../src/nascent-soul/rules';
import { thunderPower, thunderExchange } from '../../../src/nascent-soul/thunder';
import { spiritReadiness } from '../../../src/spirit';
import type { State } from '../../../src/core';
const snap=(s:State)=>({month:s.month,age:s.age,limit:s.limit,remaining:s.limit-s.age,stones:s.stones,herbs:s.herbs,injury:s.injury,sense:s.sense,spirit:s.spirit,readiness:spiritReadiness(s),equipment:{equipped:s.journey.equipped,relics:s.journey.relics},treasures:s.treasures,power:thunderPower(s),pills:s.nascentSoul.pills,marrow:s.nascentSoul.marrow,reagent:s.lizhao.reagent,realm:s.realm,failures:s.nascentSoul.failures});
const delta=(a:State,b:State)=>({months:b.month-a.month,age:b.age-a.age,limit:b.limit-a.limit,remaining:b.limit-b.age-(a.limit-a.age),stones:b.stones-a.stones,herbs:b.herbs-a.herbs,pills:b.nascentSoul.pills-a.nascentSoul.pills,sense:b.sense-a.sense,injury:b.injury-a.injury});
function attempt(initial:State,moves?:readonly string[]){const p=goldenCompletionPlayer(initial),steps:any[]=[],thunder:any[]=[];p.nascent({kind:'begin'});const start=p.state.nascentSoul.attempt;
 for(let turn=0;p.state.nascentSoul.attempt;turn++){const move=moves?.[turn]??chooseChannelingMove(p.state);steps.push({move,preview:nascentStepPreview(p.state,move)});p.nascent({kind:'step',move} as NascentAction);}
 const thunderStart=p.state.nascentSoul.thunder.battle;
 p.until(()=>!p.state.nascentSoul.thunder.battle,()=>{const move=chooseThunderMove(p.state);thunder.push({wave:p.state.nascentSoul.thunder.battle!.wave,move,preview:thunderExchange(p.state,move),hp:p.state.nascentSoul.thunder.battle!.hp});p.nascent({kind:'thunderMove',move});},'thunder',36);
 return {state:p.state,report:{start,steps,thunderStart,thunder,success:p.state.realm===3,before:snap(initial),after:snap(p.state),delta:delta(initial,p.state)}};
}
function prepare(completion:State,full:boolean){const p=goldenCompletionPlayer(completion);p.cultivate(1200);p.work(160);p.herbs(32);const before=p.state,costs:any[]=[];
 const action=(a:NascentAction)=>{const old=p.state;p.nascent(a);costs.push({action:a,delta:delta(old,p.state)});};
 for(const [topic,choice] of [['duty','decline'],['home','remember'],['promise','carry'],['companion','solitary']] as const)if(nascentPromises(p.state)[topic])action({kind:'commit',topic,choice});
 action({kind:'claimMarrow'});if(full)action({kind:'review'});
 p.until(()=>p.state.study>=4,()=>p.send({type:'advance',activity:'study',months:1}),'study',4);
 action({kind:'brew',method:'self',fire:'steady'});action({kind:'land',choice:'independent'});action({kind:'protection',choice:full?'array':'friends'});action({kind:'discoverMethod'});action({kind:'studyMethod',method:p.state.journey.main==='spring'?'stillness':'continuity'});action({kind:'practiceThunder'});
 p.until(()=>!p.state.nascentSoul.thunder.battle,()=>action({kind:'thunderMove',move:chooseThunderMove(p.state)}),'practice',12);if(!p.state.nascentSoul.thunder.practiced)throw Error('practice failed');p.rest();
 return {state:p.state,report:{full,before:snap(before),ready:snap(p.state),costs,delta:delta(before,p.state)}};
}
const report:any={date:'2026-11-04',scope:'Three earned late-stage checkpoints; public commands, save validation and deterministic replay at every step; not player win rates or a new-save UI playthrough.',builds:{},variants:[]};
for(const build of ['spring','blade','breath'] as const){
 const done=finishGoldenCompletion(goldenLateCheckpoint(build),'self'),completion=done.checkpoints.completion!;
 const sufficient=prepare(completion,true),minimum=prepare(completion,false);
 const fullRun=attempt(sufficient.state),minRun=attempt(minimum.state);
 const wrongMoves = ['release','observe','unite'];
 const wrong=attempt(minimum.state,wrongMoves);
 let retry=minimum.state;const retries:any[]=[];
 for(let round=1;round<=3;round++){
  const before=retry,failed=attempt(retry,wrongMoves);if(failed.state.realm===3)throw Error('wrong move succeeded');const p=goldenCompletionPlayer(failed.state);
  while(p.state.injury)p.nascent({kind:'recover'});
  p.work(100);p.herbs(12);p.nascent({kind:'renewMarrow'});
  if(!p.state.lizhao.reagent){p.lizhao({kind:'visit'});p.lizhao({kind:'resupply'});p.lizhao({kind:'leave'});}
  p.nascent({kind:'brew',method:'self',fire:'steady'});retry=p.state;
  retries.push({round,failure:failed.report,restocked:snap(retry),delta:delta(before,retry)});
 }
 const retried=attempt(retry);
 // Single-factor command-based differences, no edited resources or progress flags.
 const meditate=goldenCompletionPlayer(minimum.state);for(let i=0;i<12;i++)meditate.send({type:'advance',activity:'meditate',months:1});
 const stripped=goldenCompletionPlayer(minimum.state);for(const item of ['tideSeal','spiritPearl'] as const)if(stripped.state.treasures.artifacts.includes(item))stripped.send({type:'treasure',action:{kind:'withdraw',item}});
 report.builds[build]={sufficient:{...sufficient.report,run:fullRun.report},minimum:{...minimum.report,run:minRun.report},wrong:wrong.report,retries,retrySuccess:retried.report,spiritDifference:{before:snap(minimum.state),after:snap(meditate.state),run:attempt(meditate.state).report},equipmentDifference:{before:snap(minimum.state),after:snap(stripped.state),run:attempt(stripped.state).report}};
 // Eight paths x three allocations x two grounds x two methods x two protections.
 for(const land of ['independent','shared'] as const)for(const method of ['stillness','continuity'] as const)for(const protection of ['array','friends'] as const)for(const strategy of ['balanced','flow','spirit'] as const){
  const p=goldenCompletionPlayer(minimum.state);p.work(150);
  if(p.state.nascentSoul.land!==land)p.nascent({kind:'land',choice:land});
  if(p.state.nascentSoul.protection!==protection)p.nascent({kind:'protection',choice:protection});
  if(p.state.nascentSoul.thunder.method!==method){p.nascent({kind:'studyMethod',method});p.nascent({kind:'practiceThunder'});p.until(()=>!p.state.nascentSoul.thunder.battle,()=>p.nascent({kind:'thunderMove',move:chooseThunderMove(p.state)}),'variant practice',12);}
  if(strategy!==p.state.nascentSoul.strategy)p.nascent({kind:'strategy',choice:strategy});
  const paths=[];
  for(let mask=0;mask<8;mask++){const moves=[['release','channel'][mask&1]!,['anchor','observe'][(mask>>1)&1]!,['unite','circulate'][(mask>>2)&1]!];const r=attempt(p.state,moves).report;paths.push({moves,success:r.success,enteredThunder:!!r.thunderStart,steps:r.steps,delta:r.delta});}
  report.variants.push({build,land,method,protection,strategy,paths});
 }
 if(!fullRun.report.success||!minRun.report.success||!retried.report.success)throw Error('required path failed '+build);
 console.log(build,'sufficient/minimum/retry pass');
}
const combos=report.variants as any[];
report.summary={variants:combos.length,paths:combos.length*8,unreachable:combos.filter(v=>!v.paths.some((p:any)=>p.success)).map(({paths,...v}:any)=>v),universalPaths:combos[0].paths.filter((p:any,i:number)=>combos.every(v=>v.paths[i].enteredThunder)).map((p:any)=>p.moves),multiPathVariants:combos.filter(v=>v.paths.filter((p:any)=>p.success).length>1).length};
writeFileSync('docs/golden-completion/review-fixes/challenge-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
