import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
/** Plays only a new persisted visit. Animation completion never sends a game command. */
export function useVisitPerformance(saved:()=>number|null, present:()=>boolean) {
 const phase=ref<'idle'|'unfold'|'trace'|'acknowledge'>('idle');
 let timer:ReturnType<typeof setTimeout>|undefined, media:MediaQueryList|undefined;
 function skip(){if(timer!==undefined)clearTimeout(timer);timer=undefined;phase.value='idle';}
 function step(next:'unfold'|'trace'|'acknowledge'){
  phase.value=next;
  timer=setTimeout(()=>{timer=undefined;if(next==='unfold')step('trace');else if(next==='trace')step('acknowledge');else skip();},next==='trace'?1300:850);
 }
 watch(saved,(now,before)=>{skip();if(now!==null&&before===null&&present()&&!document.hidden&&!media?.matches)step('unfold');});
 watch(present,visible=>{if(!visible)skip();});
 const preference=()=>{if(media?.matches)skip();};
 const visibility=()=>{if(document.hidden)skip();};
 onMounted(()=>{media=window.matchMedia?.('(prefers-reduced-motion: reduce)');media?.addEventListener?.('change',preference);document.addEventListener('visibilitychange',visibility);});
 onBeforeUnmount(()=>{skip();media?.removeEventListener?.('change',preference);document.removeEventListener('visibilitychange',visibility);});
 function replay(){skip();if(saved()!==null&&present()&&!document.hidden&&!media?.matches)step('unfold');}
 return {phase,skip,replay};
}
