import type { State } from '../world';
/** Actual unfinished affairs. Historic choices remain saved but create no new debt. */
export const nascentPromises = (s: State) => ({
  duty: s.secretPact.story.identity === 'accept' || (s.goldenStory.duty !== 'none' && !s.goldenStory.tideComplete),
  home: s.foundationJourney.epilogue && s.secretPact.story.letter === 'none',
  promise: s.foundationJourney.sister === 'promised',
  companion: s.social.met && (s.social.bonded || ['promised', 'covenant'].includes(s.foundationJourney.bond) || ['letters', 'station'].includes(s.foundationJourney.contact)),
});
export const unsettledNascentPromises = (s: State) =>
  (Object.keys(nascentPromises(s)) as (keyof ReturnType<typeof nascentPromises>)[])
    .filter(topic => nascentPromises(s)[topic] && s.nascentSoul.commitments[topic] === 'none');
