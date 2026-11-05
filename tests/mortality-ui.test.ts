// @vitest-environment happy-dom
import { createApp, h, nextTick } from 'vue';
import { expect, it } from 'vitest';
import { createGame } from '../src/core';
import { endLife, deathScenes } from '../src/mortality';
import DeathScene from '../src/mortality/DeathScene.vue';
import LifeReview from '../src/LifeReview.vue';
import { gameAudioScene } from '../src/audio-scene';
import { audioUrl } from '../src/foundation-audio';
import { existsSync } from 'node:fs';
it('各死因显示对应背景、正确境界和遗憾，读档仍选死亡配乐',async()=>{
 for(const cause of ['lifespan','sea','lizhao','duel','tribulation'] as const){
  const s=createGame('未央','wood');s.realm=2;if(cause==='lifespan')s.age=s.limit;
  endLife(s,cause);
  const host=document.body.appendChild(document.createElement('div'));
  const app=createApp({render:()=>h('div',[h(DeathScene,{game:s}),h(LifeReview,{game:s})])});app.mount(host);await nextTick();
  expect(host.querySelector('h2')?.textContent).toBe(deathScenes[cause].title);
  expect(host.textContent).toContain('金丹');expect(host.textContent).not.toContain('尚未筑基');
  expect(host.querySelector('details')?.open).toBe(true);
  expect(host.querySelector('.death-scene')?.getAttribute('style')).toContain(deathScenes[cause].image);
  expect(existsSync('public'+deathScenes[cause].image)).toBe(true);
  const music=gameAudioScene(JSON.parse(JSON.stringify(s)),'world','青嶂关').music;
  expect(existsSync('public'+audioUrl(music))).toBe(true);
  app.unmount();host.remove();
 }
});
