export interface Deadline {
  id: string;
  month: number;
  handled: boolean;
}
export function nextDeadline(month: number, events: readonly Deadline[]) {
  return events
    .filter((e) => !e.handled && e.month > month)
    .reduce<Deadline | null>(
      (next, e) => (!next || e.month < next.month ? e : next),
      null,
    );
}
export function dueDeadlines(month: number, events: readonly Deadline[]) {
  return events.filter((e) => !e.handled && month >= e.month);
}
export function limitBySchedule(
  month: number,
  duration: number,
  events: readonly Deadline[],
) {
  const event = nextDeadline(month, events);
  const months = event ? Math.min(duration, event.month - month) : duration;
  return {
    months,
    event: event && months === event.month - month ? event : null,
  };
}
/** Pure orchestration. tick owns one monthly transition; each activity supplies its interruption policy. */
export function advanceMonths<S>(
  input: S,
  months: number,
  policy: { tick: (state: S) => S; interrupt: (state: S) => string },
) {
  if (!Number.isSafeInteger(months) || months < 0)
    throw new RangeError("Invalid month duration");
  let state = input,
    elapsed = 0;
  // Zero-duration actions are checked by their command, not by monthly interruption rules.
  let reason = months ? policy.interrupt(state) : "";
  while (elapsed < months && !reason) {
    state = policy.tick(state);
    elapsed++;
    reason = policy.interrupt(state);
  }
  return {
    state,
    elapsed,
    remaining: months - elapsed,
    stopped: !!reason,
    reason,
  };
}
