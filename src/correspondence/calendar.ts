import { tideKnown } from "../tide-survey";
import { tideNoticeMessage } from "../tide-survey/messages";
import type { State } from "../world";
import { settleWorldMonth, type WorldTransition } from "../world-evolution";
import { auctionVenues } from "../auction/venues";
import { venueAuction } from "../auction";
import { companionMessage } from "./events";
import { LETTER_LIMIT } from "./state";
import type { MessageDraft } from "./sources";
/** Propagation policy, deliberately separate from the world's occurrence calendar. */
function report(before: State, event: WorldTransition): MessageDraft | null {
  if (event.kind === "tide")
    return before.realm === 2 &&
      tideKnown(before) &&
      event.phase === "announced"
      ? tideNoticeMessage(event.edition, event.opens, event.closes)
      : null;
  if (event.kind === "companion") {
    if (
      before.realm !== 2 ||
      !before.social.met ||
      before.foundationJourney.contact === "none"
    )
      return null;
    return companionMessage({ ...before, month: event.month });
  }
  if (event.phase !== "announced") return null; // No opening/closing spam or new interruption policy.
  if (
    !venueAuction(before, event.venue) &&
    !(event.venue === "golden" && before.treasures.goldenKnown)
  )
    return null;
  const d = auctionVenues[event.venue];
  return {
    id: `auction:${event.venue}:${event.edition}`,
    kind: "notice",
    sender: d.name,
    title: `第${event.edition}届会讯`,
    body: `${d.place}第${event.opens}月开场，第${event.closes}月截止入场。新届拍品须到当地查看目录。请自备灵石并预留路程；错过可候下届。`,
    destination: "world",
    reliability: "public",
    expires: event.closes,
  };
}
/** Writes only to a command-owned result. Historical dates are delivery dates along known routes. */
export function deliverWorldCalendar(before: State, after: State): void {
  if (after.status !== "alive") return;
  const events = settleWorldMonth(before, after);
  if (!events.length) return;
  const ids = new Set(after.correspondence.letters.map((l) => l.id));
  for (const event of events) {
    const draft = report(before, event);
    if (
      !draft ||
      ids.has(draft.id) ||
      after.correspondence.letters.length >= LETTER_LIMIT
    )
      continue;
    after.correspondence.letters.push({
      ...draft,
      received: event.month,
      read: false,
      followed: false,
      response: "none",
    });
    ids.add(draft.id);
  }
}
