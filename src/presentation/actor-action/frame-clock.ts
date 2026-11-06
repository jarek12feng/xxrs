/** One frame request at a time. Late callbacks cannot advance a replacement action. */
export function createFrameClock(options: {
 request: (callback: FrameRequestCallback) => number;
 cancel: (id: number) => void;
 now: () => number;
 advance: (elapsed: number) => boolean;
}) {
 let frame:number|undefined, revision=0, disposed=false, running=false;
 function stop(){
  revision++;running=false;
  if(frame!==undefined)options.cancel(frame);
  frame=undefined;
 }
 function start(){
  if(disposed || running)return;
  running=true;
  const ticket=++revision;
  let previous=options.now();
  function tick(now:number){
   if(disposed || ticket!==revision)return;
   frame=undefined;
   const elapsed=Math.max(0,now-previous);previous=now;
   const more=options.advance(elapsed);
   if(disposed || ticket!==revision)return;
   if(more)frame=options.request(tick);else running=false;
  }
  frame=options.request(tick);
 }
 return {start,stop,dispose(){stop();disposed=true;}};
}
