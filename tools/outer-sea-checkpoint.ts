import { condensationCheckpoint } from "./golden-core-checkpoint";
import {
  dispatch,
  validState,
  migrateSave,
  type Intent,
  type State,
} from "../src/core";
import { goldenExchange } from "../src/golden-core/rules";
export function seaPlayer(initial: State) {
  let s = initial,
    serial = 0;
  const send = (i: Intent) => {
    const c = { ...i, id: `sea-${s.month}-${++serial}` };
    const n = dispatch(s, c);
    if (n === s) throw new Error(`Rejected ${JSON.stringify(i)}`);
    if (!validState(n)) throw new Error(`Invalid ${JSON.stringify(i)}`);
    if (JSON.stringify(n) !== JSON.stringify(dispatch(s, c)))
      throw new Error("Replay differs");
    s = migrateSave(JSON.parse(JSON.stringify(n)));
  };
  const work = (n: number) => {
    let i = 0;
    while (s.stones < n) {
      if (++i > 30) throw new Error("funding stalled");
      send({ type: "advance", activity: "work", months: 6 });
    }
  };
  const herbs = (n: number) => {
    while (s.herbs < n) {
      work(8);
      send({ type: "supplies" });
    }
  };
  return {
    get state() {
      return s;
    },
    send,
    work,
    herbs,
  };
}
export function outerSeaCheckpoint(
  main: "spring" | "blade" | "breath" = "spring",
) {
  const p = seaPlayer(condensationCheckpoint(main));
  p.work(12);
  p.herbs(10);
  p.send({ type: "goldenCore", action: { kind: "prepare" } });
  p.send({ type: "goldenCore", action: { kind: "route", route: "share" } });
  p.send({ type: "goldenCore", action: { kind: "fight" } });
  while (p.state.goldenCore.duel) {
    const d = p.state.goldenCore.duel;
    const options = (["guard", "discern", "strike"] as const)
      .map((move) => ({ move, p: goldenExchange(p.state, move)! }))
      .sort(
        (a, b) =>
          (b.p.damage >= d.enemy ? 10000 : 0) +
          b.p.damage -
          b.p.incoming +
          b.p.healing -
          ((a.p.damage >= d.enemy ? 10000 : 0) +
            a.p.damage -
            a.p.incoming +
            a.p.healing),
      );
    p.send({
      type: "goldenCore",
      action: { kind: "move", move: options[0]!.move },
    });
  }
  p.send({ type: "goldenCore", action: { kind: "take" } });
  p.work(16);
  p.herbs(8);
  p.send({ type: "goldenCore", action: { kind: "brew", method: "self" } });
  p.work(32);
  p.send({ type: "goldenCore", action: { kind: "site", site: "rented" } });
  if (!p.state.workshop.ward) {
    p.work(32);
    p.send({ type: "workshop", order: { product: "ward", method: "buy" } });
  }
  p.work(16);
  p.send({ type: "goldenCore", action: { kind: "guard" } });
  while (p.state.injury)
    p.send({ type: "advance", activity: "rest", months: 1 });
  p.send({ type: "goldenCore", action: { kind: "break" } });
  p.send({ type: "goldenCore", action: { kind: "farShore" } });
  return p.state;
}
