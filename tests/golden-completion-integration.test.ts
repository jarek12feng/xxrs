import { expect, it } from 'vitest';
import { validState, migrateSave } from '../src/core';
import { companionContact } from '../src/nascent-soul/contact';
import { nascentQuote } from '../src/nascent-soul/rules';
import { goldenLateCheckpoint, finishGoldenCompletion } from '../tools/golden-completion-checkpoint';
for(const main of ['spring','blade','breath'] as const)it(`${main}: public commands complete Golden Core, restore each new stage and emerge Nascent`,()=>{
 const late=goldenLateCheckpoint(main);
 const {state,checkpoints}=finishGoldenCompletion(late, main==='spring'?'self':'commission');
 expect(state.realm).toBe(3);expect(state.nascentSoul.ability).toBe('done');
 expect(state.limit).toBe(late.limit+6000);expect(state.conclave.depth).toBe(2);
 expect(state.lizhao.cleared).toBe(true);expect(state.lizhao.recipeVerified).toBe(true);
 expect(state.nascentSoul.ceremony).toBe('solitary');expect(state.lizhao.pursuit).toBe('none');
 expect(companionContact(checkpoints.completion!)).toMatchObject({reliable:true,confirmedGolden:true,lifespan:6000});
 expect(state.social.bonded).toBe(false);
 for(const [name,checkpoint] of Object.entries(checkpoints)){
  expect(validState(checkpoint),name).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(checkpoint))),name).toEqual(checkpoint);
 }
 expect(Object.keys(checkpoints)).toContain('nascent-phase-2');
},60000);

// This is an additional real relationship branch; the three core journeys above remain unbonded.
it('a companion with independently confirmed Golden news can reunite and covenant on the normal completion timeline',()=>{
 const late=goldenLateCheckpoint('spring');
 const {state,checkpoints}=finishGoldenCompletion(late,'self','marry');
 const contact=companionContact(checkpoints['companion-contact']!);
 expect(contact.age).toBeGreaterThan(200*12);
 expect(contact.lifespan).toBe(500*12);
 expect(contact.confirmedGolden).toBe(true);
 expect(contact.reliable).toBe(true);
 expect(nascentQuote(checkpoints.completion!,{kind:'ceremony',choice:'discuss'}).error).toContain('定情');
 expect(state.social.bonded).toBe(true);
 expect(state.foundationJourney.bond).toBe('covenant');
 expect(state.nascentSoul.ceremony).toBe('married');
 for(const name of ['companion-contact','covenant-discussed','covenant-witnessed','covenant-married']) {
  expect(validState(checkpoints[name]),name).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(checkpoints[name]))),name).toEqual(checkpoints[name]);
 }
 expect(state.realm).toBe(3);
},60000);
