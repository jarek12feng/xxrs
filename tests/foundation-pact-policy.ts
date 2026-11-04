import { expect } from "vitest";
import { type State, type Intent, dispatch, validState } from "../src/core";
/** Public commands only; no fabricated trial flags or direct location writes. */
export { finishPactTrial } from "../tools/foundation-pact-policy";
import { finishPactTrial } from "../tools/foundation-pact-policy";
export function completePactFrom(s: State) {
  let state = s,
    serial = 0;
  const send = (intent: Intent) => {
    state = dispatch(state, {
      ...intent,
      id: `test-pact-policy-${state.month}-${++serial}`,
    });
    expect(validState(state)).toBe(true);
    return state;
  };
  finishPactTrial({
    get state() {
      return state;
    },
    send,
    act: (action) => send({ type: "foundationJourney", action }),
  });
  return state;
}
