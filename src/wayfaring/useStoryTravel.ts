import { additionalDomains } from "./additional-story";
import { completedStoryRoute } from "./completed-routes";
import { computed, ref, watch } from "vue";
import type { State, Intent } from "../world";
import {
  resumedStoryRoute,
  storyArrived,
  storyRoute,
  type StoryRoute,
} from "./story-routes";
/** UI state only. The parent publishes a new game only after persistence succeeds. */
export function useStoryTravel(
  game: () => State | null,
  busy: () => boolean,
  send: (i: Intent) => void,
  includeAdditional = false,
) {
  const selected = ref<StoryRoute | null>(null),
    arrived = ref(false),
    submitted = ref(false);
  const route = computed(() =>
    selected.value && game() && !arrived.value
      ? (storyRoute(game()!, selected.value.intent) ?? selected.value)
      : selected.value,
  );
  const resumable = () => game()?.wayfaring.passage;
  watch(
    resumable,
    (p) => {
      if (p && !selected.value && !includeAdditional) {
        selected.value = resumedStoryRoute(game()!);
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
    if (busy() || arrived.value || !route.value || route.value.error) return;
    selected.value = route.value;
    submitted.value = true;
    send(route.value.intent);
  }
  function act(intent: Intent) {
    if (busy() || !game()) return;
    const next = storyRoute(game()!, intent);
    if (!next || next.domain === "inland" || (!includeAdditional && additionalDomains.has(next.domain))) {
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
    if (!next) {
      selected.value = null;
      arrived.value = false;
      submitted.value = false;
      return;
    }
    if (includeAdditional && old && !selected.value) {
      const completed = completedStoryRoute(next, old);
      if (completed) {
        selected.value = completed;
        arrived.value = true;
        return;
      }
    }
    if (!next || !old || !selected.value || !submitted.value || next === old)
      return;
    const plan = selected.value;
    if (!next.wayfaring.passage && !next.wayfaring.trip && storyArrived(next, old, plan))
      arrived.value = true;
  });
  function cancel() {
    if (busy()) return;
    submitted.value = false;
    send({ type: "wayfaring", action: { kind: "cancel" } });
  }
  watch(
    resumable,
    (next, old) => {
      if (old && !next && !submitted.value) close();
    },
  );
  return { route, arrived, act, depart, close, cancel };
}
