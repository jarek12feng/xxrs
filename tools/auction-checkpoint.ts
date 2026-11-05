import type { State } from "../src/core";
import { createCultivator } from "./cultivator-fixture";
/** Isolated QA checkpoint, never a natural new-game playthrough. */
export function auctionFixture(
  venue: "market" | "foundation" = "market",
  month = 12,
): State {
  const s = createCultivator("候会修士", "wood", 823);
  s.month = month;
  s.age = 192 + month;
  s.story.stage = "waiting";
  s.qi = 120;
  s.stones = 300;
  Object.assign(s.adventure, {
    step: "done",
    clue: true,
    method: "medicine",
    ready: true,
    attempts: 1,
    rescueChoice: "supplies",
  });
  s.adventure.road.stage = "market";
  s.adventure.road.thanked = true;
  if (venue === "foundation") {
    s.realm = 1;
    s.limit = 2400;
    s.foundationJourney.location = "estate";
  }
  return s;
}

/** Earns road access through public commands, then places the calendar near an auction for isolated QA. */
export function auctionTravelFixture(): State {
  const p = journeyPlayer(mistCheckpoint(42, 'wood', 'female'));
  p.act({kind:'travel',destination:'ferry'});
  p.fight('well');
  p.act({kind:'inherit',technique:'spring'});
  p.fight('exit');
  p.act({kind:'ferryOutcome',outcome:'escort'});
  p.act({kind:'travel',destination:'estate'});
  let s = structuredClone(p.state);
  const month = Math.ceil((s.month + 2) / 60) * 60 - 2;
  s.age += month - s.month;
  s.month = month;
  s = dispatch(s,{type:'treasure',action:{kind:'catalog',venue:'foundation'},id:'travel-fixture-catalog'});
  s.foundationJourney.location='home';
  s.wayfaring.swordFlight='learned';
  s.stones=Math.max(300,s.stones);
  if(!validState(s))throw Error('Invalid auction travel checkpoint');
  return s;
}
import { journeyPlayer } from './foundation-journey-checkpoint';
import { mistCheckpoint } from './mist-checkpoint';
import { dispatch, validState } from '../src/core';
