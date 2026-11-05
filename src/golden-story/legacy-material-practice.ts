/** v56–v57 trial data. Only migration reads these shapes; new games use scene objects. */
export type LegacyMaterialTopic = 'method' | 'pill' | 'ground';
export type LegacyMaterialPractice =
  | { topic: 'method'; flow: number; joined: boolean }
  | { topic: 'pill'; layers: number; clear: number }
  | { topic: 'ground'; outlet: boolean; supply: number; guard: 'none' | 'inner' | 'outer' };

export function freshLegacyMaterialPractice(topic: LegacyMaterialTopic, step: 0 | 1): LegacyMaterialPractice {
  if (topic === 'method') return { topic, flow: step === 0 ? 2 : 0, joined: false };
  if (topic === 'pill') return { topic, layers: 0, clear: 0 };
  return { topic, outlet: false, supply: step === 0 ? 2 : 0, guard: 'none' };
}

export function validLegacyMaterialPractice(x: unknown): x is LegacyMaterialPractice {
  if (!x || typeof x !== 'object' || 'schema' in x) return false;
  const v = x as LegacyMaterialPractice;
  const level = (n: number) => [0, 1, 2].includes(n);
  if (v.topic === 'method') return level(v.flow) && typeof v.joined === 'boolean';
  if (v.topic === 'pill') return level(v.layers) && level(v.clear);
  if (v.topic === 'ground') return level(v.supply) && typeof v.outlet === 'boolean' && ['none', 'inner', 'outer'].includes(v.guard);
  return false;
}
