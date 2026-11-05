import { tidePeriod, tideWindow, tideNotice } from "../tide-survey";
import type { State } from "../world";
import { auctionVenues, venueIds } from "../auction/venues";
import type { Venue } from "../auction/catalog";
import {
  companionChronology,
  companionMilestone,
} from "../golden-story/companion";
export type WorldTransition =
  | {
      kind: "tide";
      id: string;
      month: number;
      edition: number;
      phase: "announced" | "opened" | "closed";
      opens: number;
      closes: number;
    }
  | {
      kind: "auction";
      id: string;
      month: number;
      venue: Venue;
      edition: number;
      phase: "announced" | "opened" | "closed";
      opens: number;
      closes: number;
    }
  | {
      kind: "companion";
      id: string;
      month: number;
      newsId: number;
      goldenAt: number | null;
    };
/** Deterministic calendar adapters. This function neither advances time nor grants knowledge. */
export function worldTransitions(s: State, until: number): WorldTransition[] {
  if (!Number.isSafeInteger(until) || until < s.month)
    throw new RangeError("Invalid world interval");
  const out: WorldTransition[] = [];
  if (s.status !== "alive" || until === s.month) return out;
  for (const venue of venueIds) {
    const d = auctionVenues[venue];
    const first = Math.max(1, Math.floor((s.month - d.window) / d.period));
    const last = Math.floor((until + d.notice) / d.period);
    for (let edition = first; edition <= last; edition++) {
      const opens = edition * d.period,
        closes = opens + d.window;
      for (const [phase, month] of [
        ["announced", opens - d.notice],
        ["opened", opens],
        ["closed", closes],
      ] as const)
        if (month > s.month && month <= until)
          out.push({
            kind: "auction",
            id: `auction:${venue}:${edition}:${phase}`,
            venue,
            edition,
            phase,
            month,
            opens,
            closes,
          });
    }
  }
  for (
    let edition = Math.max(1, Math.floor((s.month - tideWindow) / tidePeriod));
    edition <= Math.floor((until + tideNotice) / tidePeriod);
    edition++
  ) {
    const opens = edition * tidePeriod,
      closes = opens + tideWindow;
    for (const [phase, month] of [
      ["announced", opens - tideNotice],
      ["opened", opens],
      ["closed", closes],
    ] as const)
      if (month > s.month && month <= until)
        out.push({
          kind: "tide",
          id: `tide:${edition}:${phase}`,
          edition,
          phase,
          month,
          opens,
          closes,
        });
  }
  const c = companionChronology(s);
  if (c) {
    const age = s.social.gender === "male" ? 288 : 312;
    const dates = [
      c.met + 120,
      c.met + 600,
      c.met + 2400 - age,
      c.met + 6000 - age,
      ...(c.goldenAt === null
        ? []
        : [c.goldenAt - 240, c.goldenAt - 120, c.goldenAt]),
    ];
    for (const month of new Set(dates)) {
      if (month <= s.month || month > until) continue;
      const before = companionMilestone({ ...s, month: month - 1 }),
        after = companionMilestone({ ...s, month });
      if (after && after.id !== before?.id)
        out.push({
          kind: "companion",
          id: `companion:${after.id}`,
          month,
          newsId: after.id,
          goldenAt: after.goldenAt,
        });
    }
  }
  return out.sort(
    (a, b) => a.month - b.month || a.id.localeCompare(b.id, "en"),
  );
}
/** Earliest future boundary; read-only and independent of which panels are open. */
export function nextWorldBoundary(s: State): WorldTransition | null {
  // Every auction has a boundary within 120 months; no need to enumerate a lifetime.
  return worldTransitions(s, s.month + 120)[0] ?? null;
}
/** Called with the actual elapsed interval, including interrupted actions, never requested duration. */
export function settleWorldMonth(
  before: State,
  after: State,
): WorldTransition[] {
  if (before.life !== after.life || after.month <= before.month) return [];
  return worldTransitions(before, after.month);
}
