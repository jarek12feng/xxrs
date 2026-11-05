import type { State } from '../world';
/** Saved facts decide physical presence; old invitations never override an active trip. */
export function friendPresence(s: State): 'none'|'preparing'|'away'|'resting'|'departed'|'unknown' {
  const j=s.friendJourney;
  if(!j || j.startedAt===null)return 'none';
  if(s.social.metMonth===null || 288+s.month-s.social.metMonth>=6000)return 'unknown';
  const phase=j.facts.at(-1)?.id;
  return phase==='preparing'?'preparing':phase==='traveling'?'away':phase==='returned'||phase==='resting'?'resting':phase==='complete'?'departed':'unknown';
}
export function friendOnJourney(s: State): boolean {
  return ['preparing','away','resting'].includes(friendPresence(s));
}
export function ceremonyInProgress(s:State):boolean {
  return ['discussed','witnessed'].includes(s.nascentSoul.ceremony) ||
    (s.nascentSoul.covenant.meeting!=='none'&&s.nascentSoul.ceremony==='none');
}
