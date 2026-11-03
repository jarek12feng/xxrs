import { computed, ref, watch } from "vue";
import type { State, Intent } from "../world";
import {
  resumedStoryRoute,
  storyLocation,
  storyRoute,
  type StoryRoute,
} from "./story-routes";
/** UI state only. The parent publishes a new game only after persistence succeeds. */
export function useStoryTravel(
  game: () => State,
  busy: () => boolean,
  send: (i: Intent) => void,
) {
  const selected = ref<StoryRoute | null>(null),
    arrived = ref(false),
    submitted = ref(false);
  const route = computed(() =>
    selected.value && !arrived.value
      ? (storyRoute(game(), selected.value.intent) ?? selected.value)
      : selected.value,
  );
  watch(
    () => game().wayfaring.passage,
    (p) => {
      if (p && !selected.value) {
        selected.value = resumedStoryRoute(game());
        arrived.value = false;
      }
    },
    { immediate: true },
  );
  function close() {
    if (busy()) return;
    selected.value = null;
    arrived.value = false;
    submitted.value = false;
  }
  function depart() {
    if (busy() || !route.value || route.value.error) return;
    selected.value = route.value;
    submitted.value = true;
    send(route.value.intent);
  }
  function act(intent: Intent) {
    if (busy()) return;
    const next = storyRoute(game(), intent);
    if (!next) {
      send(intent);
      return;
    }
    selected.value = next;
    arrived.value = false;
    submitted.value = false;
    // Nearby exits have no cost decision: retain one click, then show the saved journey.
    if (!next.months && !next.stones && !next.herbs && !next.error) depart();
  }
  watch(game, (next, old) => {
    if (!selected.value || !submitted.value || next === old) return;
    const plan = selected.value;
    if (
      !next.wayfaring.passage &&
      storyLocation(next, plan.domain) === plan.to &&
      storyLocation(old, plan.domain) !== plan.to
    )
      arrived.value = true;
  });
  function cancel() {
    if (busy()) return;
    submitted.value = false;
    send({ type: "wayfaring", action: { kind: "cancel" } });
  }
  watch(
    () => game().wayfaring.passage,
    (next, old) => {
      if (old && !next && !submitted.value) close();
    },
  );
  return { route, arrived, act, depart, close, cancel };
}
