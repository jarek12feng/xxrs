import {goldenCompletionPlayer} from '../../../../tools/golden-completion-checkpoint';
import {conclaveCheckpoint} from '../../../../tools/conclave-checkpoint';
/** Public-command checkpoints, no direct age/progress edits or browser save access. */
export function teachingCheckpoints(){
 const p=goldenCompletionPlayer(conclaveCheckpoint('spring'));
 p.until(()=>p.state.outerSea.reminded,()=>p.send({type:'advance',activity:'cultivate',months:120}),'notice');
 p.act({kind:'visit'});p.act({kind:'meet'});
 const present=structuredClone(p.state);
 if(present.month>=2400)throw Error('Early checkpoint no longer has Shen present');
 p.act({kind:'leave'});
 p.until(()=>p.state.month>=2400,()=>p.send({type:'advance',activity:'work',months:6}),'later teaching',300);
 p.act({kind:'visit'});
 return {present,record:p.state};
}
