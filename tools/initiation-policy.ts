import type { State, Intent } from '../src/core';
import { admissionWitness } from '../src/initiation/rules';
/** Public-command continuation for existing journeys that have earned their witness. */
export function admissionStep(s:State,branch:'dan'|'jian'='jian'):Intent|null {
  if(s.journey.branch !== 'none')return null;
  const phase=s.qiJourney.narrative.initiation.admission;
  if(phase === 'none' || phase === 'deferred')return {type:'qiJourney',action:'entry:seek'};
  if(phase === 'seeking')return admissionWitness(s) === 'none' ? null : {type:'qiJourney',action:'entry:review'};
  if(phase === 'recommended')return {type:'qiJourney',action:'entry:terms'};
  return {type:'join',branch};
}
/** Follow the introductory scenes with no fixture grants or state mutation. */
export function seekerStep(s:State,branch:'none'|'dan'|'jian'='none'):Intent|null {
  const n=s.qiJourney.narrative.initiation;
  if(n.kit !== 'none')return null;
  if(s.adventure.step === 'ferry') {
    if(n.arrival === 'landed')return {type:'qiJourney',action:'entry:unload'};
    if(n.arrival === 'unloaded')return {type:'qiJourney',action:'entry:steady'};
    if(s.qiJourney.narrative.motive === 'unspoken')return {type:'qiJourney',action:'origin:world'};
  }
  if(s.adventure.step !== 'done')return null;
  if(n.admission === 'none')return {type:'qiJourney',action:'entry:seek'};
  if(n.admission === 'seeking' && n.practice !== 'passed')return {type:'qiJourney',action:'entry:careful'};
  if(branch === 'none')return {type:'qiJourney',action:n.admission === 'deferred' ? 'entry:contract' : 'entry:defer'};
  return admissionStep(s,branch);
}
