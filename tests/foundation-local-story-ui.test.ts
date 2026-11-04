// @vitest-environment happy-dom
import { createApp, h, nextTick, shallowRef } from 'vue';
import { expect, it } from 'vitest';
import FoundationPanel from '../src/foundation-journey/FoundationPanel.vue';
import { dispatch, validState, type Intent } from '../src/core';
import { localStoryCheckpoint } from '../docs/narrative-implementation/foundation/local-story-checkpoint';

it.each([
  ['home','sect-handover','师门交接','婉拒固定职责','婉拒'],
  ['ferry','well-marks','沉井旧刻','核对沉井旧刻度','旧测法'],
  ['snow','foreign-ledger','外宗货单','核对外宗货单','照霜'],
  ['ending','home-letter','归山家书','收好家乡旧信','旧信'],
] as const)('%s opens its local story directly and records a command once', async (place,id,label,action,result) => {
  const state=shallowRef(localStoryCheckpoint(place)), commands:Intent[]=[];
  const host=document.createElement('div');
  const app=createApp({render:()=>h(FoundationPanel,{game:state.value,busy:false,onAct:(intent:Intent)=>{
    commands.push(intent);state.value=dispatch(state.value,{...intent,id:`local-ui-${commands.length}`});
    expect(validState(state.value)).toBe(true);
  }})});
  app.mount(host);
  try {
    const before=JSON.stringify(state.value);
    const hotspot=host.querySelector<HTMLButtonElement>(`[data-hotspot="${id}"]`)!;
    expect(hotspot?.textContent).toContain(label);hotspot.click();await nextTick();
    const panel=host.querySelector(`[aria-label="${label}"]`)!;
    expect(panel).toBeTruthy();expect(host.querySelector('.secret-pact')).toBeNull();
    expect(JSON.stringify(state.value)).toBe(before);expect(commands).toHaveLength(0);
    const button=[...panel.querySelectorAll('button')].find(b=>b.textContent?.includes(action))!;
    expect(button).toBeTruthy();expect(button.disabled).toBe(false);button.click();await nextTick();
    expect(commands).toHaveLength(1);expect(panel.textContent).toContain(result);
    expect([...panel.querySelectorAll('button')].some(b=>b.textContent?.includes(action))).toBe(false);
    expect(host.querySelector(`[data-hotspot="${id}"]`)).toBeTruthy();
  } finally {app.unmount();}
});
