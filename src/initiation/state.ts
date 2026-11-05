export interface Initiation {
  arrival: 'landed' | 'unloaded' | 'sensed' | 'legacy';
  admission: 'none' | 'seeking' | 'recommended' | 'pledged' | 'deferred';
  witness: 'none' | 'rescue' | 'escort' | 'valley' | 'ruins';
  practice: 'none' | 'retry' | 'passed';
  kit: 'none' | 'sect' | 'independent' | 'legacy';
  last: string;
}
export const freshInitiation = (): Initiation => ({arrival:'landed', admission:'none', witness:'none', practice:'none', kit:'none', last:''});
export function validInitiation(x: unknown): x is Initiation {
  if (!x || typeof x !== 'object') return false;
  const n = x as Initiation;
  return ['landed','unloaded','sensed','legacy'].includes(n.arrival)
    && ['none','seeking','recommended','pledged','deferred'].includes(n.admission)
    && ['none','rescue','escort','valley','ruins'].includes(n.witness)
    && (['recommended','pledged'].includes(n.admission) ? n.witness !== 'none' : true)
    && ['none','retry','passed'].includes(n.practice)
    && ['none','sect','independent','legacy'].includes(n.kit)
    && typeof n.last === 'string' && n.last.length <= 3000;
}
