import { createCultivator as createGame } from "../tools/cultivator-fixture";
// @vitest-environment happy-dom
import { foundationStep } from '../tools/foundation-playthrough';
// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApp, nextTick, type App as VueApp } from "vue";
import { createPinia } from "pinia";
import App from "../src/App.vue";
import {
  dispatch,
} from "../src/core";
import { load, save } from "../src/save";
const audio = vi.hoisted(() => ({
  cue: vi.fn(),
  settings: vi.fn(),
  scene: vi.fn(),
  hidden: vi.fn(),
  dispose: vi.fn(),
  unlock: vi.fn(async () => true),
}));
vi.mock("../src/audio", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../src/audio")>()),
  createSoundscape: () => audio,
}));
vi.mock("../src/save", () => ({ load: vi.fn(), save: vi.fn() }));
let app: VueApp;
const flush = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};
function button(label: string) {
  const b = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.includes(label),
  );
  if (!b) throw new Error(`Missing ${label}`);
  return b;
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(save).mockResolvedValue();
});
afterEach(() => {
  app?.unmount();
  document.body.innerHTML = "";
  vi.useRealTimers();
});

it('行功读档尊重标题页、拦截后台快捷键，保存失败可见并可重试',async()=>{
 let s=createGame('review','wood',847293);
 for(let i=0;i<600;i++){const n=foundationStep(s,true,'medicine');if(n.type==='break')break;s=dispatch(s,{...n,id:'p'+i});}
 s=dispatch(s,{type:'ascension',action:'start',id:'start'});
 vi.mocked(load).mockResolvedValue({state:s,recovered:false});
 app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();
 expect(document.querySelector('.title-screen')).not.toBeNull();
 expect(document.querySelector('.ascension-overlay')).toBeNull();
 button('继续游戏').click();await flush();
 const heading=document.querySelector('.ascension-overlay h2') as HTMLElement;heading.focus();
 heading.dispatchEvent(new KeyboardEvent('keydown',{key:'c',bubbles:true}));await flush();
 expect(document.querySelector('[data-panel="character"]')).toBeNull();
 expect(document.querySelector('.shell')?.hasAttribute('inert')).toBe(true);
 vi.mocked(save).mockRejectedValue(new Error('review disk failure'));
 const method=[...document.querySelectorAll<HTMLButtonElement>('.ascension-overlay button')].find(b=>b.textContent?.includes('以神识'))!;
 method.click();await flush();
 expect(document.querySelector('.ascension-overlay [role=alert]')?.textContent).toContain('review disk failure');
 expect(document.querySelector('.ascension-overlay')).not.toBeNull();
 expect(document.querySelector('.ascension-overlay h2')?.textContent).toContain('引气归流');
 vi.mocked(save).mockResolvedValue();
 method.click();await flush();
 expect(document.querySelector('.ascension-overlay h2')?.textContent).toContain('稳住经脉');
});
