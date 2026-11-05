import { friendOnJourney, friendPresence } from "../friend-journey/presence";
import type { State } from "../world";
/** Shared reliable-news boundary. No calendar event implies death or a breakthrough. */
export function companionContact(s: State) {
  const known = s.social.met && s.social.metMonth !== null;
  const elapsed = known ? Math.max(0, s.month - s.social.metMonth!) : 0;
  const age = (s.social.gender === "male" ? 24 : 26) * 12 + elapsed;
  const goldenAt = (
    s.goldenStory as typeof s.goldenStory & {
      companionGoldenAt?: number | null;
    }
  ).companionGoldenAt;
  const confirmedGolden =
    known &&
    typeof goldenAt === "number" &&
    Number.isSafeInteger(goldenAt) &&
    goldenAt >= s.social.metMonth! &&
    goldenAt <= s.month;
  const lifespan = (confirmedGolden ? 500 : 200) * 12;
  const reliable =
    known &&
    age < lifespan &&
    !["missing", "shelter"].includes(s.foundationJourney.whereabouts);
  return {
    known,
    elapsed,
    age,
    lifespan,
    confirmedGolden,
    reliable,
    invitationCurrent: s.nascentSoul.contactedAt !== null && s.month-s.nascentSoul.contactedAt<=120 && (s.friendJourney?.startedAt == null || s.nascentSoul.contactedAt >= s.friendJourney.startedAt+18),
    availableForMeeting: !friendOnJourney(s),
    present:
      friendPresence(s) === "none" && reliable &&
      ["home", "returned", "rescued"].includes(s.foundationJourney.whereabouts),
  };
}
