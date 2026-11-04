import { createTravelEngine, type TravelerProfile, type TravelLeg } from './engine';
import { inlandRoads, travelSpeeds } from "./geography";
import type { Destination } from "../foundation-journey/state";
import { destinations } from "../foundation-journey/content";
// Schematic coordinates, not inferred distances from the old illustrated atlas.
export const sites: Record<
  Destination,
  { x: number; y: number; name: string }
> = {
  home: { x: 110, y: 330, name: destinations.home.name },
  ferry: { x: 320, y: 355, name: destinations.ferry.name },
  inn: { x: 530, y: 300, name: destinations.inn.name },
  estate: { x: 730, y: 410, name: destinations.estate.name },
  snow: { x: 650, y: 110, name: destinations.snow.name },
  frontier: { x: 850, y: 230, name: destinations.frontier.name },
};
export const roads: readonly [Destination, Destination, number][] =
  inlandRoads.map((r) => [r.from, r.to, r.land]);
export type TravelMode = "land" | "flight";
const inlandLegs: TravelLeg[] = inlandRoads.flatMap(r =>
  (['land','flight'] as const).flatMap(mode => [
    {from:r.from,to:r.to,mode,distance:mode==='land'?r.land:r.air,minRealm:mode==='flight'?1:0,timing:{kind:'distance' as const}},
    {from:r.to,to:r.from,mode,distance:mode==='land'?r.land:r.air,minRealm:mode==='flight'?1:0,timing:{kind:'distance' as const}},
  ]));
export const inlandTravel = createTravelEngine(Object.keys(sites),inlandLegs);
/** Compatibility for authored geography and legacy migration, not a character permission check. */
export function routeBetween(from: Destination,to: Destination,mode: TravelMode,realm=1) {
  const traveler:TravelerProfile={realm,speeds:{land:travelSpeeds.land,flight:realm>=2?travelSpeeds.goldenFlight:travelSpeeds.foundationFlight},effects:[]};
  const result=inlandTravel.plan({from,to,mode,traveler});
  if(!result.ok)return {path:[] as Destination[],distance:0,speed:0,months:0};
  return {...result.plan,path:result.plan.path as Destination[]};
}
