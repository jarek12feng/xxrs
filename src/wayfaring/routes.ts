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
export function routeBetween(
  from: Destination,
  to: Destination,
  mode: TravelMode,
  realm = 1,
) {
  const queue: { at: Destination; path: Destination[]; distance: number }[] = [
    { at: from, path: [from], distance: 0 },
  ];
  const speed =
    mode === "land"
      ? travelSpeeds.land
      : realm >= 2
        ? travelSpeeds.goldenFlight
        : travelSpeeds.foundationFlight;
  while (queue.length) {
    queue.sort((a, b) => a.distance - b.distance);
    const n = queue.shift()!;
    if (n.at === to)
      return {
        path: n.path,
        distance: n.distance,
        speed,
        months: Math.ceil(n.distance / speed),
      };
    for (const road of inlandRoads) {
      const next =
        road.from === n.at ? road.to : road.to === n.at ? road.from : null;
      if (next && !n.path.includes(next))
        queue.push({
          at: next,
          path: [...n.path, next],
          distance: n.distance + (mode === "land" ? road.land : road.air),
        });
    }
  }
  return { path: [], distance: 0, speed, months: 0 };
}
