import { teachingSolution } from "../src/golden-story/teaching";
import {chooseThunderMove} from "./nascent-thunder-policy";
/** Public-command journey evidence. No realm, progress or resource fixture edits. */
import { dispatch, validState, migrateSave, type State, type Intent } from '../src/core';
import { conclaveCheckpoint, chooseConclaveMove } from './conclave-checkpoint';
import { chooseLizhaoMove } from './lizhao-fixture';
import { conclaveQuote, type ConclaveAction } from '../src/conclave/rules';
import { lizhaoQuote, type LizhaoAction } from '../src/lizhao/rules';
import { nascentQuote, nascentPromises, type NascentAction } from '../src/nascent-soul/rules';
export type GoldenBuild = 'spring'|'blade'|'breath';
export function goldenCompletionPlayer(initial:State) {
 let state=structuredClone(initial),serial=0;
 const checkpoints:Record<string,State>={};
 const send=(intent:Intent)=>{
  let id: string;
  do { id=`completion-${++serial}-${state.month}`; } while(state.seen.includes(id));
  const command={...intent,id};
  const next=dispatch(state,command);
  if(next===state){
   const detail=intent.type==='conclave'?conclaveQuote(state,intent.action).error:intent.type==='lizhao'?lizhaoQuote(state,intent.action).error:intent.type==='nascentSoul'?nascentQuote(state,intent.action).error:'';
   throw Error(`Rejected ${JSON.stringify(intent)}: ${detail}; month ${state.month}, injury ${state.injury}, location ${state.outerSea.location}/${state.conclave.location}/${state.lizhao.location}`);
  }
  const recentLog=next.log.slice(0,3);
  if(!validState(next))throw Error(`Invalid after ${JSON.stringify(intent)}: ${JSON.stringify(recentLog)}`);
  if(JSON.stringify(next)!==JSON.stringify(dispatch(state,command)))throw Error('Deterministic replay differs');
  const restored=migrateSave(JSON.parse(JSON.stringify(next)));
  if(!restored||JSON.stringify(restored)!==JSON.stringify(next))throw Error(`Save differs after ${JSON.stringify(intent)}`);
  state=restored;
 };
 const until=(done:()=>boolean,step:()=>void,label:string,max=200)=>{for(let i=0;!done();i++){if(i>=max)throw Error(`Bound exceeded: ${label}`);step();}};
 const work=(amount:number)=>until(()=>state.stones>=amount,()=>send({type:'advance',activity:'work',months:6}),'work',80);
 const herbs=(amount:number)=>until(()=>state.herbs>=amount,()=>{work(8);send({type:'supplies'});},'supplies',80);
 const rest=()=>until(()=>state.injury===0,()=>send({type:'advance',activity:'rest',months:1}),'rest',12);
 const cultivate=(target:number)=>until(()=>state.outerSea.cultivation>=target,()=>send({type:'advance',activity:'cultivate',months:120}),'cultivate',100);
 const act=(action:ConclaveAction)=>send({type:'conclave',action});
 const lizhao=(action:LizhaoAction)=>send({type:'lizhao',action});
 const nascent=(action:NascentAction)=>send({type:'nascentSoul',action});
 const remember=(name:string)=>{checkpoints[name]=structuredClone(state);};
 return {get state(){return state;},checkpoints,send,until,work,herbs,rest,cultivate,act,lizhao,nascent,remember};
}
export function goldenLateCheckpoint(main:GoldenBuild='spring') {
 const p=goldenCompletionPlayer(conclaveCheckpoint(main));
 p.until(()=>p.state.outerSea.reminded,()=>p.send({type:'advance',activity:'cultivate',months:120}),'conclave notice',10);
 p.act({kind:'visit'});p.act({kind:'meet'});
 for(const topic of ['method','spirit','pill','ground'] as const) { p.send({type:'goldenStory',action:{kind:'ask',topic,source:'seat'}}); for(const move of teachingSolution(topic))p.send({type:'goldenStory',action:{kind:'practice',move}}); }
 p.herbs(24);p.work(conclaveQuote(p.state,{kind:'training',style:'ward'}).stones);p.act({kind:'training',style:'ward'});
 const fight=(kind:'contest'|'fight')=>{
  const before=p.state.conclave.wins+p.state.conclave.depth;
  p.act({kind});p.until(()=>!p.state.conclave.duel,()=>p.act({kind:'move',move:chooseConclaveMove(p.state)}),'conclave battle',18);
  if(p.state.conclave.wins+p.state.conclave.depth<=before)throw Error(`Lost conclave ${main}/${kind}`);
 };
 fight('contest');fight('contest');p.act({kind:'route',route:'current'});
 for(let depth=0;depth<2;depth++){
  p.work(30);p.herbs(12);p.act({kind:'prepare'});
  if(depth){p.until(()=>p.state.sense>=36,()=>p.send({type:'advance',activity:'meditate',months:1}),'spirit training',50);p.act({kind:'attune'});p.send({type:'treasure',action:{kind:'deploy',item:'spiritPearl'}});}
  p.act({kind:'enter'});fight('fight');
 }
 p.send({type:'goldenStory',action:{kind:'rubbing',recipient:'hengxuan'}});
 p.act({kind:'method',method:'inherit'});p.cultivate(599);p.work(30);p.act({kind:'late'});p.act({kind:'leave'});
 p.send({type:'goldenStory',action:{kind:'oldRecord'}});
 p.send({type:'goldenStory',action:{kind:'companion'}});
 return p.state;
}
export function finishGoldenCompletion(initial:State, brew:'self'|'commission'='commission', ceremony:'defer'|'marry'='defer') {
 const p=goldenCompletionPlayer(initial);p.remember('late');
 p.rest();p.work(180);p.herbs(32);
 p.lizhao({kind:'visit'});p.lizhao({kind:'route',route:'cooperate'});p.lizhao({kind:'prepare',preparation:'purify'});p.lizhao({kind:'enter'});
 const fight=()=>{p.lizhao({kind:'fight'});p.remember(p.state.lizhao.cleared?'battle':'lizhao-battle');p.until(()=>!p.state.lizhao.duel,()=>p.lizhao({kind:'move',move:chooseLizhaoMove(p.state)}),'lizhao fight',18);};
 fight();if(!p.state.lizhao.outerCleared)throw Error('Lost outer lizhao');p.remember('lizhao-outer');
 p.lizhao({kind:'deeper'});fight();if(!p.state.lizhao.cleared)throw Error('Lost inner lizhao');
 p.lizhao({kind:'chamber'});p.lizhao({kind:'verify'});p.lizhao({kind:'allocate',allocation:'share'});p.remember('lizhao-verified');p.lizhao({kind:'return'});p.lizhao({kind:'leave'});
 p.cultivate(899);p.rest();p.nascent({kind:'trial'});p.remember('completion-trial');
 for(const move of ['body','mind','break','body','mind','break'] as const)p.nascent({kind:'trialMove',move});
 if(!p.state.nascentSoul.trialWon)throw Error('Lost completion trial');
 p.nascent({kind:'complete'});p.remember('completion');p.cultivate(1200);
 for (const [topic,choice] of [['duty','decline'],['home','letter'],['promise','carry'],['companion','explain']] as const) if(nascentPromises(p.state)[topic]) p.nascent({kind:'commit',topic,choice});
 if(ceremony==='marry') {
  p.nascent({kind:'contact'});p.remember('companion-contact');
  p.send({type:'confess'});
  if(!p.state.social.scene)throw Error('Confession scene missing');
  p.send({type:'choose',instanceId:p.state.social.scene.id,option:'yes'});
  p.nascent({kind:'covenant',topic:'meeting',choice:'remember'});
  p.nascent({kind:'ceremony',choice:'discuss'});p.remember('covenant-discussed');
  p.nascent({kind:'covenant',topic:'form',choice:'friends'});
  p.nascent({kind:'covenant',topic:'token',choice:'map'});
  p.nascent({kind:'covenant',topic:'promise',choice:'return'});p.remember('covenant-prepared');
  p.nascent({kind:'ceremony',choice:'witness'});p.remember('covenant-witnessed');
  p.nascent({kind:'ceremony',choice:'meal'});p.remember('covenant-married');
 } else p.nascent({kind:'ceremony',choice:p.state.social.bonded || p.state.foundationJourney.bond==='promised' || p.state.foundationJourney.bond==='covenant'?'defer':'solitary'});
 p.nascent({kind:'claimMarrow'});p.nascent({kind:'review'});p.herbs(6);p.work(100);
 if(brew==='self')p.until(()=>p.state.study>=4,()=>p.send({type:'advance',activity:'study',months:1}),'pill knowledge',4);
 p.nascent({kind:'brew',method:brew,fire:'steady'});p.nascent({kind:'land',choice:'independent'});p.nascent({kind:'protection',choice:'array'});p.nascent({kind:'discoverMethod'});p.nascent({kind:'studyMethod',method:p.state.journey.main==='spring'?'stillness':'continuity'});p.nascent({kind:'practiceThunder'});p.until(()=>!p.state.nascentSoul.thunder.battle,()=>p.nascent({kind:'thunderMove',move:chooseThunderMove(p.state)}),'practice thunder',12);if(!p.state.nascentSoul.thunder.practiced)throw Error('Lost practice thunder');p.rest();p.herbs(24);p.remember('nascent-ready');
 p.nascent({kind:'begin'});p.remember('nascent-phase-0');p.nascent({kind:'step',move:'channel'});p.remember('nascent-phase-1');p.nascent({kind:'step',move:'observe'});p.remember('nascent-phase-2');p.nascent({kind:'step',move:'unite'});p.remember('thunder-start');p.until(()=>!p.state.nascentSoul.thunder.battle,()=>p.nascent({kind:'thunderMove',move:chooseThunderMove(p.state)}),'tribulation',36);if(p.state.realm!==3)throw Error('Lost tribulation '+JSON.stringify({foundation:p.state.foundation,sense:p.state.sense,last:p.state.nascentSoul.thunder.last}));p.remember('nascent');
 p.nascent({kind:'emerge'});p.nascent({kind:'celebrate',choice:'simple',office:'declined'});p.remember('celebration');p.nascent({kind:'survey'});p.nascent({kind:'shelter'});p.nascent({kind:'cross'});p.remember('ability');
 return {state:p.state,checkpoints:p.checkpoints};
}
