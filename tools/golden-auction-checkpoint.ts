import { outerSeaCheckpoint } from "./outer-sea-checkpoint";
import { dispatch, validState } from "../src/core";
/** Controlled QA start: public-command progression, calendar/resources adjusted for the auction window. */
export function goldenAuctionFixture() {
  let s = outerSeaCheckpoint();
  s.stones = Math.max(s.stones, 500);
  s = dispatch(s, {
    type: "outerSea",
    action: { kind: "sail" },
    id: "gold-auction-sail",
  });
  s = dispatch(s, {
    type: "outerSea",
    action: { kind: "meet" },
    id: "gold-auction-meet",
  });
  const month = Math.ceil((s.month + 4) / 120) * 120 - 4;
  s.age += month - s.month;
  s.month = month;
  if (!validState(s)) throw Error("Invalid golden auction fixture");
  return s;
}
