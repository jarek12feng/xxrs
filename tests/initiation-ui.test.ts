// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {createApp,nextTick,type App as VueApp} from 'vue';
import {createPinia} from 'pinia';
import App from '../src/App.vue';
import {createGame,dispatch,type State} from '../src/core';
import {load,save} from '../src/save';
vi.mock('../src/save',()=>({load:vi.fn(),save:vi.fn()}));
let app:VueApp;
async function flush(){for(let i=0;i<12;i++)await nextTick();}
function button(text:string){const b=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b,text).toBeTruthy();return b!;}
async function click(text:string){const b=button(text);expect(b.disabled,text).toBe(false);b.click();await flush();}
async function mount(s:State){localStorage.clear();vi.mocked(load).mockResolvedValue({state:s,recovered:false});vi.mocked(save).mockResolvedValue();app=createApp(App).use(createPinia());app.mount(document.body.appendChild(document.createElement('div')));await flush();await click('继续游戏');}
function rescued(){let s=createGame('初来','wood',42,'insightful','male');for(const [i,action] of ['inspect','depart','medicine','prepare','depart','trail','challenge','return'].entries())s=dispatch(s,{id:`rescue-${i}`,type:'adventure',action:action as never});return s;}
afterEach(()=>{app?.unmount();document.body.innerHTML='';vi.clearAllMocks();});
it('shows identity and motivation before rescue, with no bag, manuals, sect or cultivation entrance',async()=>{
 await mount(createGame('初来','wood',42,'insightful','male'));
 const dock=()=>document.querySelector('.quick-dock')?.textContent??'';
 expect(dock()).not.toContain('储物袋');expect(dock()).not.toContain('功法');
 expect(document.body.textContent).toContain('十六岁');expect(document.body.textContent).toContain('药乡');
 expect([...document.querySelectorAll('button')].some(b=>b.textContent?.includes('洞府修行'))).toBe(false);
 await click('把家乡药包搬上石阶');await click('试着强压气息');expect(document.body.textContent).toContain('可以再试');
 await click('放缓呼吸');await click('想有能力护住牵挂的人');
 expect(button('漂回的药篓')).toBeTruthy();expect(dock()).not.toContain('储物袋');
});
it.each(['sect','independent'])('unlocks earned kit through the %s scene and only displays sect entrance for members',async route=>{
 await mount(rescued());
 expect(document.body.textContent).toContain('药坪求学');
 expect(document.querySelector('.quick-dock')?.textContent).not.toContain('储物袋');
 await click('拿出引荐纸');await click('一把拉紧两根绳');expect(document.body.textContent).toContain('没有损失物资');
 await click('先辨受力');
 if(route==='sect') {await click('请执事评议');await click('听取门规');await click('向温蘅行礼');}
 else {await click('暂不拜师');await click('与药队立约');}
 expect(document.querySelector('.quick-dock')?.textContent).toContain('储物袋');expect(document.querySelector('.quick-dock')?.textContent).toContain('功法');
 expect(document.querySelector('.quick-dock')?.textContent.includes('师门与委托')).toBe(route==='sect');
 await click('入道功法木匣');await click('学会并主修 · 长春诀');
 const saved=vi.mocked(save).mock.calls.at(-1)?.[0];expect(saved?.journey.main).toBe('spring');expect(saved?.stones).toBe(24);
});
