import { travelSpeeds } from './geography';
/** Real seconds are compressed for viewing, never used to settle world months.
 * 4s to establish the scene, then logarithmic distance at the travel-mode speed.
 * PathTraveler applies the remaining progress to this full-route duration.
 */
export function travelPlaybackDuration(distance:number, mode:'walk'|'land'|'flight'|'sail', realm:number) {
  const speed = mode==='flight' ? (realm>=2 ? travelSpeeds.goldenFlight : travelSpeeds.foundationFlight)
    : mode==='sail' ? 9000 : travelSpeeds.land;
  const ratio=speed/travelSpeeds.land;
  const safeDistance=Number.isFinite(distance)?Math.max(0,distance):0;
  return Math.round(Math.min(18,4+1.5*Math.log2(1+safeDistance/(20*ratio)))*1000);
}
