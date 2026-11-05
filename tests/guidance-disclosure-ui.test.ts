// @vitest-environment happy-dom
import {createApp,h,nextTick,reactive} from 'vue';
import {expect,it} from 'vitest';
import CombatBar from '../src/scene2d/combat/CombatBar.vue';
import AssayPanel from '../src/lizhao/AssayPanel.vue';
import {freshAssay} from '../src/lizhao/assay';
it('应对提示默认关闭；展开不发命令，换敌后关闭，代价与撤退始终在外',async()=>{
 const props=reactive({turn:0,player:50,playerMax:50,enemy:80,enemyMax:80,enemyName:'石偶',tell:'双臂合拢，重击迎面压来。',help:'守势可减轻正面承压。',options:[{id:'guard',label:'守势',detail:'灵草 2 · 承伤 4'}],retreatLabel:'撤退 · 补给不退'});
 const commands:string[]=[];const host=document.body.appendChild(document.createElement('div'));
 const app=createApp({render:()=>h(CombatBar,{...props,onMove:(id:string)=>commands.push(id),onRetreat:()=>commands.push('retreat')})});app.mount(host);
 try{
  const detail=host.querySelector('details')!;expect(detail.open).toBe(false);
  expect(host.querySelector('.combat-tell')?.textContent).not.toContain('守势');
  const move=host.querySelector<HTMLButtonElement>('.combat-commands button')!;
  expect(move.textContent).toContain('灵草 2');expect(move.closest('details')).toBeNull();
  expect(host.querySelector('.combat-retreat')?.textContent).toContain('补给不退');
  detail.querySelector('summary')!.click();await nextTick();expect(detail.open).toBe(true);expect(commands).toEqual([]);
  props.enemyName='执卫';await nextTick();expect(host.querySelector('details')!.open).toBe(false);
  move.click();await nextTick();expect(commands).toEqual(['guard']);
 }finally{app.unmount();host.remove();}
});
it('试炉目标保留验收条件与时间成本，操作策略须主动展开',async()=>{
 const assay=freshAssay();assay.phase='cloudy';
 const before=structuredClone(assay);const host=document.body.appendChild(document.createElement('div'));
 const app=createApp({render:()=>h(AssayPanel,{assay,verified:false})});app.mount(host);
 try{
  const detail=host.querySelector('details')!;expect(detail.open).toBe(false);
  expect(host.querySelector('[role="status"] > p')?.textContent).toContain('分离达到两层');
  expect(host.querySelector('[role="status"] > p')?.textContent).not.toContain('滤草或御印');
  expect(host.querySelector('small')?.textContent).toContain('其他行炉操作各一月');
  detail.querySelector('summary')!.click();await nextTick();expect(detail.open).toBe(true);expect(assay).toEqual(before);
 }finally{app.unmount();host.remove();}
});
it('精确推演默认折叠，招式作用与耗材仍在按钮上；展开不出招',async()=>{
 const host=document.body.appendChild(document.createElement('div'));const commands:string[]=[];
 const app=createApp(CombatBar,{turn:0,player:30,playerMax:40,enemy:50,enemyMax:50,enemyName:'石偶',tell:'双臂合拢。',options:[{id:'guard',label:'守势',detail:'护身蓄势 · 耗草 1',preview:'伤敌 20 / 承伤 4'}],onMove:(id:string)=>commands.push(id)});app.mount(host);
 try{const button=host.querySelector('.combat-commands button')!;expect(button.textContent).toContain('耗草 1');expect(button.textContent).not.toContain('承伤');const details=host.querySelector('details')!;expect(details.open).toBe(false);details.querySelector('summary')!.click();await nextTick();expect(details.open).toBe(true);expect(details.textContent).toContain('承伤 4');expect(commands).toEqual([]);}finally{app.unmount();host.remove();}
});
