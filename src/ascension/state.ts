export interface Ascension {
  realm: 0 | 1;
  step: number;
  strain: number;
  history: string[];
}
export function ascensionChance(a?: Ascension | null) {
  return a?.step === 3 ? Math.max(10, 100 - a.strain * 15) : null;
}
export function validAscension(a: Ascension | null, realm: number) {
  return a === null || !!a && a.realm === realm && [0,1].includes(a.realm) &&
    Number.isInteger(a.step) && a.step >= 0 && a.step <= 3 &&
    Number.isInteger(a.strain) && a.strain >= 0 && a.strain <= a.step * 2 &&
    Array.isArray(a.history) && a.history.length === a.step &&
    a.history.every(x => typeof x === 'string' && x.length <= 300);
}
