import type { State } from '../world';
import { travelSpeeds } from './geography';
import type { TravelerProfile } from './engine';
/** Equipment/content adapters add typed effects here, never inside story callers.
 * No current item grants travel speed; do not infer it from combat damage or rarity. */
export function travelProfile(s: State): TravelerProfile {
  return {
    realm:s.realm,
    speeds:{land:travelSpeeds.land,sail:9000,
      ...(s.realm>=1 && s.wayfaring.swordFlight!=='none'
        ? {flight:s.realm>=2?travelSpeeds.goldenFlight:travelSpeeds.foundationFlight}:{}),
    },
    effects:[],
  };
}
