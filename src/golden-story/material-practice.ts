import type { State } from '../world';
import type { TeachingMove, TeachingPractice } from './teaching';
import * as method from './practices/method';
import * as pill from './practices/pill';
import * as ground from './practices/ground';
export type MaterialTopic = 'method' | 'pill' | 'ground';
export type MaterialPractice = method.PracticeState | pill.PracticeState | ground.PracticeState;
const domains = { method, pill, ground };
export const freshMaterialPractice = (topic: MaterialTopic, step: 0 | 1): MaterialPractice => domains[topic].fresh(step);
export function validMaterialPractice(x: unknown): x is MaterialPractice {
  // Completed local states are consumed atomically by the public command.
  // Persisting one as an active exercise would strand the player.
  return (method.valid(x) && !x.released) || (pill.valid(x) && !x.collected) || (ground.valid(x) && x.outcome === 'pending');
}
export const upgradeMaterialPractice = (topic: MaterialTopic, old: unknown, step: 0 | 1): MaterialPractice => domains[topic].upgrade(old, step);
export const materialChoices = (topic: MaterialTopic) => domains[topic].choices;
export const materialSolution = (topic: MaterialTopic, step: 0 | 1) => domains[topic].solution(step) as TeachingMove[];
export function materialPracticeQuote(s: State, move: TeachingMove) {
  const p = s.goldenStory.practice;
  if (!p || p.topic === 'spirit') return { error: '当前没有这项试法操作', herbs: 0, next: method.fresh(0) as MaterialPractice, failed: false, passed: false, note: '' };
  return domains[p.topic].quote(s, move);
}
export function materialPracticeView(p: TeachingPractice) {
  return domains[p.topic === 'spirit' ? 'method' : p.topic].view({step:p.step,material:p.material});
}
