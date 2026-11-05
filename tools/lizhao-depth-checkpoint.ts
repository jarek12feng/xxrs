/** Public-command checkpoint for isolated UI testing; not a continuous new-save playthrough. */
import { artifactGrowthCheckpoint } from './artifact-growth-checkpoint';
import { goldenCompletionPlayer } from './golden-completion-checkpoint';
import { chooseLizhaoMove } from './lizhao-fixture';
export function lizhaoDepthCheckpoint(){
 const p=goldenCompletionPlayer(artifactGrowthCheckpoint());
 p.lizhao({kind:'enter'});p.lizhao({kind:'fight'});
 p.until(()=>!p.state.lizhao.duel,()=>p.lizhao({kind:'move',move:chooseLizhaoMove(p.state)}),'inner layer',18);
 if(!p.state.lizhao.cleared)throw Error('Inner layer failed');
 p.lizhao({kind:'chamber'});return p.state;
}
