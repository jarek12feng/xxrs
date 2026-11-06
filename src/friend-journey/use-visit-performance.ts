import { computed, watch } from 'vue';
import { useActorPlayback } from '../presentation/actor-action/use-actor-playback';
/** Plays only a new persisted visit. Animation completion never sends a game command. */
export function useVisitPerformance(saved:()=>number|null, present:()=>boolean) {
 const player=useActorPlayback<'unfold'|'trace'|'acknowledge'>();
 const phase=computed(()=>player.frame.value ?? 'idle');
 const skip=player.stop;
 function replay(){
  skip();
  if(saved()!==null&&present())player.play([
   {value:'unfold',durationMs:850},
   {value:'trace',durationMs:1300},
   {value:'acknowledge',durationMs:850},
  ]);
 }
 watch(saved,(now,before)=>{skip();if(now!==null&&before===null)replay();});
 watch(present,visible=>{if(!visible)skip();});
 return {phase,skip,replay};
}
