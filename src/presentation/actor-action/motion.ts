/** Pixels only. Coordinates may be percentages or pixels, but one actor uses one space. */
export interface ActorPoint {
  x: number;
  y: number;
}
export interface ActorMotion {
  position: ActorPoint;
  facing: 1 | -1;
  moving: boolean;
  frame: number;
}
export interface Approach {
  /** Reviewed, walkable waypoints. The caller owns scene geometry. */
  path: readonly ActorPoint[];
  faceX?: number;
  instant?: boolean;
}
const finite = (p: ActorPoint) => Number.isFinite(p.x) && Number.isFinite(p.y);
const face = (from: number, to: number, previous: 1 | -1): 1 | -1 =>
  to === from ? previous : to < from ? -1 : 1;

/** A renderer advances elapsed presentation time; no clock, game state or storage lives here. */
export function createActorMotion(options: {
  initial: ActorPoint;
  duration: (from: ActorPoint, to: ActorPoint) => number;
  show: (state: ActorMotion) => void;
}) {
  let state: ActorMotion = {
    position: { ...options.initial },
    facing: 1,
    moving: false,
    frame: 0,
  };
  let path: ActorPoint[] = [],
    segment = 0,
    elapsed = 0,
    gait = 0;
  let origin = { ...state.position },
    duration = 0,
    faceX: number | undefined;
  let arrived: (() => void) | undefined,
    disposed = false,
    revision = 0;
  const publish = () =>
    options.show({ ...state, position: { ...state.position } });
  function cancel() {
    revision++;
    path = [];
    arrived = undefined;
    state = { ...state, moving: false, frame: 0 };
    publish();
  }
  function finish() {
    const ticket = revision;
    const done = arrived;
    arrived = undefined;
    path = [];
    state = {
      ...state,
      moving: false,
      frame: 0,
      facing:
        faceX === undefined
          ? state.facing
          : face(state.position.x, faceX, state.facing),
    };
    publish();
    if (!disposed && ticket === revision) done?.();
  }
  function beginSegment() {
    origin = { ...state.position };
    elapsed = 0;
    const end = path[segment]!;
    state.facing = face(origin.x, end.x, state.facing);
    const ms = options.duration(origin, end);
    duration = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  }
  return {
    get snapshot(): ActorMotion {
      return { ...state, position: { ...state.position } };
    },
    approach(request: Approach, onArrival?: () => void) {
      if (
        disposed ||
        !request.path.length ||
        request.path.some((p) => !finite(p)) ||
        (request.faceX !== undefined && !Number.isFinite(request.faceX))
      )
        return;
      revision++;
      // Replace atomically: never call the superseded arrival handler.
      path = request.path.map((p) => ({ ...p }));
      segment = 0;
      gait = 0;
      faceX = request.faceX;
      arrived = onArrival;
      state.moving = true;
      state.frame = 0;
      beginSegment();
      if (request.instant) {
        // Resolve the final approach direction, including paths with a vertical final leg.
        let previous = state.position;
        for (const point of path) {
          state.facing = face(previous.x, point.x, state.facing);
          previous = point;
        }
        state.position = { ...path[path.length - 1]! };
        finish();
      } else publish();
    },
    advance(ms: number) {
      if (disposed || !state.moving || !Number.isFinite(ms) || ms < 0) return;
      gait += ms;
      state.frame = Math.floor(gait / 100) % 8;
      let remaining = ms;
      while (state.moving) {
        const end = path[segment]!;
        const spent = Math.min(remaining, Math.max(0, duration - elapsed));
        elapsed += spent;
        remaining -= spent;
        const progress = duration === 0 ? 1 : elapsed / duration;
        state.position = {
          x: origin.x + (end.x - origin.x) * progress,
          y: origin.y + (end.y - origin.y) * progress,
        };
        if (progress < 1) {
          publish();
          return;
        }
        segment++;
        if (segment >= path.length) {
          finish();
          return;
        }
        beginSegment();
      }
    },
    skip() {
      if (disposed || !state.moving) return;
      let previous = state.position;
      for (const point of path.slice(segment)) {
        state.facing = face(previous.x, point.x, state.facing);
        previous = point;
      }
      state.position = { ...path[path.length - 1]! };
      finish();
    },
    cancel() {
      if (!disposed) cancel();
    },
    reset(point: ActorPoint) {
      if (disposed || !finite(point)) return;
      revision++;
      path = [];
      arrived = undefined;
      state = { ...state, position: { ...point }, moving: false, frame: 0 };
      publish();
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        cancel();
      }
    },
  };
}
