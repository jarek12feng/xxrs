import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
type Anchor = {x:number;y:number};
/** Converts the same actor/hotspot space into a bounded bubble and an exact tail. */
export function speechBubbleStyle(point: Anchor, width=1280, height=720) {
  const bubbleWidth=Math.min(420,width-32);
  const x=point.x*width/100, y=point.y*height/100;
  const left=Math.max(16,Math.min(width-bubbleWidth-16,x-bubbleWidth/2));
  return {
    '--bubble-left': `${left}px`,
    '--bubble-bottom': `${height-y+38}px`,
    '--bubble-tail': `${Math.max(16,Math.min(bubbleWidth-32,x-left))}px`,
    '--bubble-content-height': `${Math.max(100,Math.min(300,y-180))}px`,
  };
}
export function useSpeechBubble(root:Ref<HTMLElement|undefined>, point:()=>Anchor|undefined) {
  const size=ref({width:1280,height:720});
  let observer:ResizeObserver|undefined;
  onMounted(()=>{
    if(!root.value)return;
    const update=()=>{if(root.value?.clientWidth)size.value={width:root.value.clientWidth,height:root.value.clientHeight};};
    update();
    if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(update);observer.observe(root.value);}
  });
  onBeforeUnmount(()=>observer?.disconnect());
  return computed(()=>point()?speechBubbleStyle(point()!,size.value.width,size.value.height):undefined);
}
