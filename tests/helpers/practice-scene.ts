import { nextTick } from 'vue';
import { expect } from 'vitest';
import { materialChoices, type MaterialTopic } from '../../src/golden-story/material-practice';
export async function selectPracticeObject(move: string) {
  const pill: Record<string, string> = { pillWarm:'main',pillSplit:'main',pillReset:'main',pillHold:'side',pillVent:'vent',pillCollect:'bottle',pillHerb:'herb' };
  const ground: Record<string, string> = { 'ground-inner':'guard','ground-outer':'guard','ground-divide':'guard','ground-open':'outlet','ground-close':'outlet','ground-clear':'aisle','ground-gather':'rack','ground-transfer':'rack','ground-dry':'rack','ground-test':'tide' };
  const object = pill[move] ? `.pill-practice .object.${pill[move]}` : ground[move] ? `.ground-practice .object.${ground[move]}` : null;
  if (object) { const button = document.querySelector<HTMLButtonElement>(object); expect(button).not.toBeNull(); button!.click(); await nextTick(); }
}
export async function clickPractice(topic: MaterialTopic, move: string) {
  await selectPracticeObject(move);
  const label = materialChoices(topic).find(c => c.move === move)!.label;
  const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes(label));
  expect(button, label).toBeTruthy(); expect(button!.disabled, label).toBe(false);
  button!.click(); await nextTick(); await nextTick();
}
