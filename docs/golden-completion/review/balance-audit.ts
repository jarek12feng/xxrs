/** Read-only independent audit. Public commands only; no player saves or rule mutations. */
import { writeFileSync } from 'node:fs';
import { dispatch, validState, type State, type Intent } from '../../../src/core';
import { goldenLateCheckpoint, finishGoldenCompletion, goldenCompletionPlayer } from '../../../tools/golden-completion-checkpoint';
import { chooseLizhaoMove } from '../../../tools/lizhao-fixture';
import { nascentQuote, nascentStepPreview } from '../../../src/nascent-soul/rules';
import { lizhaoExchange } from '../../../src/lizhao/combat';
import { foundationPower } from '../../../src/foundation-journey/combat';
let serial=0;
function send(s:State,i:Intent){const n=dispatch(s,{...i,id:`ind-balance-${++serial}`});if(n===s)throw Error(`Rejected ${JSON.stringify(i)} ${nascentQuote(s,{kind:'begin'}).error}`);if(!validState(n))throw Error(`Invalid ${JSON.stringify(i)}`);return n;}
const ns=(s:State,a:any)=>send(s,{type:'nascentSoul',action:a});
const lz=(s:State,a:any)=>send(s,{type:'lizhao',action:a});
const snap=(s:State)=>({month:s.month,age:s.age,remaining:s.limit-s.age,limit:s.limit,stones:s.stones,herbs:s.herbs,injury:s.injury,sense:s.sense,foundation:s.foundation,study:s.study,power:foundationPower(s),pills:s.nascentSoul.pills,marrow:s.nascentSoul.marrow,reagent:s.lizhao.reagent,realm:s.realm});
function battle(s:State,style:string){s=lz(s,{kind:'fight'});const first=s.lizhao.duel!;const initial={hp:first.hp,enemy:first.enemy};const rows:any[]=[];while(s.lizhao.duel){const move=style==='observed'?chooseLizhaoMove(s):style as any;const p=lizhaoExchange(s,move)!;const old=s.lizhao.duel;s=lz(s,{kind:'move',move});rows.push({move,hp:old.hp,enemy:old.enemy,damage:p.damage,incoming:p.incoming,healing:p.healing,toxin:p.toxin,after:s.lizhao.duel?.hp??null});}return {state:s,report:{initial,turns:rows.length,won:s.lizhao.location!=='harbor',injury:s.injury,herbs:s.herbs,rows}};}
const result:any={generated:new Date().toISOString(),method:'Public-command paths; fixed seeds, not player win rates',builds:{},trial:{},ritual:{},retries:[]};
let baseline:State|undefined,trial:State|undefined,late:State|undefined;
for(const build of ['spring','blade','breath'] as const){
 const start=goldenLateCheckpoint(build),done=finishGoldenCompletion(start,build==='spring'?'self':'commission');
 const funding=goldenCompletionPlayer(start);funding.rest();funding.work(180);funding.herbs(32);const funded=funding.state;
 const milestones=Object.fromEntries(Object.entries(done.checkpoints).map(([k,v])=>[k,snap(v)]));
 const battles:any[]=[];
 for(const route of ['cooperate','independent'])for(const preparation of ['ward','purify'])for(const style of ['observed','strike','guard','discern']){
 let s=lz(funded,{kind:'visit'});s=lz(s,{kind:'route',route});s=lz(s,{kind:'prepare',preparation});s=lz(s,{kind:'enter'});
 const outer=battle(s,style);let inner:any=null;if(outer.report.won){s=lz(outer.state,{kind:'deeper'});inner=battle(s,style).report;}
 battles.push({route,preparation,style,outer:outer.report,inner});}
 result.builds[build]={milestones,battles,funded:snap(funded),workSample:{before:snap(start),after:snap(send(start,{type:'advance',activity:'work',months:6}))}};
 if(build==='spring'){baseline=done.checkpoints['nascent-ready'];trial=done.checkpoints['completion-trial'];late=start;}
}
// All 729 six-move trial sequences from one legal checkpoint. No random seed alteration.
const trialOut:any[]=[];
for(let code=0;code<729;code++){let s=trial!,n=code;const moves=[];for(let t=0;t<6&&s.nascentSoul.trial;t++){const move=['body','mind','break'][n%3];n=Math.floor(n/3);moves.push(move);s=ns(s,{kind:'trialMove',move});}trialOut.push({moves,won:s.nascentSoul.trialWon,injury:s.injury});}
result.trial={initial:trial!.nascentSoul.trial,success:trialOut.filter(x=>x.won).length,total:729,samples:trialOut.filter(x=>x.won).slice(0,12)};
for(const strategy of ['balanced','flow','spirit']){
 const rows=[];
 for(let mask=0;mask<8;mask++){let s=baseline!;if(strategy!==s.nascentSoul.strategy)s=ns(s,{kind:'strategy',choice:strategy});s=ns(s,{kind:'begin'});const start=s.nascentSoul.attempt;const moves=[['release','channel'][mask&1],['anchor','observe'][(mask>>1)&1],['unite','circulate'][(mask>>2)&1]];const steps=[];
 for(const move of moves){if(!s.nascentSoul.attempt)break;steps.push({move,preview:nascentStepPreview(s,move)});s=ns(s,{kind:'step',move});}rows.push({moves,start,steps,success:s.realm===3,end:snap(s)});}
 result.ritual[strategy]=rows;
}
// Stronger training / removing deployed artifacts through commands: ritual input unchanged.
let stronger=baseline!;for(let i=0;i<12;i++)stronger=send(stronger,{type:'advance',activity:'meditate',months:1});
result.preparation={base:snap(baseline!),stronger:snap(stronger),baseAttempt:ns(baseline!,{kind:'begin'}).nascentSoul.attempt,strongerAttempt:ns(stronger,{kind:'begin'}).nascentSoul.attempt};
let stripped=baseline!;for(const item of ['tideSeal','spiritPearl'] as const){const n=dispatch(stripped,{id:`strip-${++serial}`,type:'treasure',action:{kind:'withdraw',item}});if(n!==stripped)stripped=n;}
result.preparation.artifactsWithdrawn={power:foundationPower(stripped),attempt:ns(stripped,{kind:'begin'}).nascentSoul.attempt};
// Consecutive failed attempts, actual replenishment path and recovery cost.
let s=baseline!;
for(let round=1;round<=3;round++){
 const before=snap(s);s=ns(s,{kind:'begin'});for(const move of ['release','observe','unite'])s=ns(s,{kind:'step',move});const failed=snap(s);
 while(s.injury)s=ns(s,{kind:'recover'});
 if(s.stones<100){for(let j=0;s.stones<100&&j<100;j++)s=send(s,{type:'advance',activity:'work',months:6});}
 if(s.herbs<8)s=send(s,{type:'supplies'});
 s=ns(s,{kind:'renewMarrow'});
 if(s.lizhao.reagent<1){s=lz(s,{kind:'visit'});s=lz(s,{kind:'resupply'});s=lz(s,{kind:'leave'});}
 s=ns(s,{kind:'brew',method:'self',fire:'steady'});
 result.retries.push({round,before,failed,readyAgain:snap(s),months:s.month-before.month});
}
result.retriesFinal=ns(ns(ns(ns(s,{kind:'begin'}),{kind:'step',move:'channel'}),{kind:'step',move:'observe'}),{kind:'step',move:'circulate'}).realm;
// Same earned completion checkpoint, lowest-cost legal selections; no optional review or ceremony.
const full=finishGoldenCompletion(late!,'self');
const p=goldenCompletionPlayer(full.checkpoints.completion);p.cultivate(1200);
const prepStart=snap(p.state);const costs:any[]=[];
const prepare=(action:any)=>{const old=p.state;p.nascent(action);costs.push({action,months:p.state.month-old.month,stones:old.stones-p.state.stones,herbs:old.herbs-p.state.herbs});};
for(const [topic,choice] of [['duty','decline'],['home','remember'],['promise','carry'],['companion','solitary']])prepare({kind:'commit',topic,choice});
prepare({kind:'claimMarrow'});
if(p.state.study<4)p.until(()=>p.state.study>=4,()=>p.send({type:'advance',activity:'study',months:1}),'study');
p.work(66);p.herbs(6);
prepare({kind:'brew',method:'self',fire:'steady'});prepare({kind:'land',choice:'independent'});prepare({kind:'protection',choice:'friends'});
const minimum=p.state;prepare({kind:'begin'});prepare({kind:'step',move:'channel'});prepare({kind:'step',move:'observe'});prepare({kind:'step',move:'circulate'});
result.minimum={prepStart,ready:snap(minimum),reviewed:minimum.nascentSoul.reviewed,ceremony:minimum.nascentSoul.ceremony,attempt:ns(minimum,{kind:'begin'}).nascentSoul.attempt,costs,end:snap(p.state)};
// A short work comparison at late/cap; no income forecast from synthetic resources.
result.income=[late!,baseline!].map(s=>{const n=send(s,{type:'advance',activity:'work',months:6});return{before:snap(s),after:snap(n),gain:n.stones-s.stones,months:n.month-s.month};});
const failedForRest=ns(ns(ns(ns(baseline!,{kind:'begin'}),{kind:'step',move:'release'}),{kind:'step',move:'observe'}),{kind:'step',move:'unite'});
result.restComparison={failure:snap(failedForRest),ordinary:snap(send(failedForRest,{type:'advance',activity:'rest',months:3})),dedicated:snap(ns(ns(failedForRest,{kind:'recover'}),{kind:'recover'}))};
// Public waiting/work to a real near-lifespan state, not a direct age edit.
let elderly=baseline!;
while(elderly.limit-elderly.age>25){const months=Math.min(12,elderly.limit-elderly.age-25);elderly=send(elderly,{type:'advance',activity:'work',months});}
const oldStart=snap(elderly),entry=nascentQuote(elderly,{kind:'begin'});elderly=ns(elderly,{kind:'begin'});elderly=ns(elderly,{kind:'step',move:'channel'});elderly=ns(elderly,{kind:'step',move:'observe'});
result.lifespanBoundary={start:oldStart,beginQuote:entry,stuck:snap(elderly),attempt:elderly.nascentSoul.attempt,lastQuote:nascentQuote(elderly,{kind:'step',move:'circulate'})};
// Full preparation variants use exactly the same earned completion, not edited flags.
const variants=[];
for(const review of [false,true])for(const method of ['self','commission'])for(const land of ['shared','independent'])for(const protection of ['array','friends']){
 const p=goldenCompletionPlayer(full.checkpoints.completion);p.cultivate(1200);p.work(150);p.herbs(6);
 for(const [topic,choice] of [['duty','decline'],['home','remember'],['promise','carry'],['companion','solitary']])p.nascent({kind:'commit',topic,choice} as any);
 const before=snap(p.state);p.nascent({kind:'claimMarrow'});if(review)p.nascent({kind:'review'});p.nascent({kind:'brew',method,fire:'steady'} as any);p.nascent({kind:'land',choice:land} as any);p.nascent({kind:'protection',choice:protection} as any);
 const ready=snap(p.state);p.nascent({kind:'begin'});const attempt=p.state.nascentSoul.attempt;
 for(const move of ['channel','observe','circulate'])p.nascent({kind:'step',move} as any);
 variants.push({review,method,land,protection,costStones:before.stones-ready.stones,costHerbs:before.herbs-ready.herbs,months:ready.month-before.month,attempt,success:p.state.realm===3});
}
result.preparationVariants=variants;
writeFileSync('docs/golden-completion/review/balance-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({builds:Object.fromEntries(Object.entries(result.builds).map(([k,v]:any)=>[k,v.milestones])),trial:result.trial,preparation:result.preparation,retries:result.retries,ritual:Object.fromEntries(Object.entries(result.ritual).map(([k,v]:any)=>[k,{success:v.filter((x:any)=>x.success).length,total:v.length}]))},null,2));
