import { createGame } from '../src/core';
/** Controlled pre-existing cultivator, for isolated rule/UI tests, never a new-player route.
 * Matches the pre-v43 starting resources while explicitly recording the old kit.
 * Full journey policies must use core.createGame and earn their kit through commands.
 */
export function createCultivator(...args:Parameters<typeof createGame>) {
  const s=createGame(...args);
  s.stones=12;
  s.qiJourney.narrative.initiation.arrival='legacy';
  s.qiJourney.narrative.initiation.kit='legacy';
  return s;
}
