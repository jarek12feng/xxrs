import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import { observeActionEnvironment } from '../../presentation/actor-action/environment';
import { heroBattlePose } from '../../presentation/art';
import { createCombatSequence, type CombatBeat, type CombatSnapshot } from './sequence';

export function useCombatPresentation(snapshot: () => CombatSnapshot | null) {
 const beat=shallowRef<CombatBeat|null>(null);
 let environment:ReturnType<typeof observeActionEnvironment>|undefined;
 const player=createCombatSequence({
  initial:snapshot(),schedule:(ms,callback)=>setTimeout(callback,ms),cancel:timer=>clearTimeout(timer),
  reduced:()=>document.hidden||!!environment?.reduced(),show:value=>{beat.value=value;},
 });
 const pose=computed(()=>{
  if(beat.value?.phase==='impact'&&beat.value.playerLost)return 'hurt';
  return beat.value?.phase==='strike'?heroBattlePose(beat.value.snapshot.effect):'idle';
 });
 watch(snapshot,value=>player.sync(value),{deep:true});
 const stop=()=>player.stop();
 onMounted(()=>{environment=observeActionEnvironment(stop);});
 onBeforeUnmount(()=>{player.dispose();environment?.dispose();});
 return {beat,pose,stop};
}
