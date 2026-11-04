import { it, expect } from "vitest";
import { dispatch, validState, migrateSave, type State } from "../src/core";
import { lizhaoCheckpoint } from "../tools/lizhao-checkpoint";
import { chooseLizhaoMove } from "../tools/lizhao-fixture";
import { lizhaoQuote, type LizhaoAction } from "../src/lizhao/rules";
for (const main of ["spring", "blade", "breath"] as const)
  it(`${main}公共命令进离照、两层取药、读档与离场`, () => {
    let s: State = lizhaoCheckpoint(main),
      serial = 0;
    const act = (action: LizhaoAction) => {
      expect(lizhaoQuote(s, action).error, action.kind).toBe("");
      const old = s;
      s = dispatch(s, {
        type: "lizhao",
        action,
        id: `integration-${++serial}`,
      });
      expect(s).not.toBe(old);
      expect(validState(s), JSON.stringify(s.lizhao)).toBe(true);
      expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
    };
    act({ kind: "visit" });
    act({ kind: "route", route: "independent" });
    act({ kind: "prepare", preparation: "purify" });
    act({ kind: "enter" });
    for (let layer = 0; layer < 2; layer++) {
      act({ kind: "fight" });
      let rounds = 0;
      while (s.lizhao.duel) {
        if (++rounds > 18) throw Error("stuck");
        act({ kind: "move", move: chooseLizhaoMove(s) });
      }
      expect(layer ? s.lizhao.cleared : s.lizhao.outerCleared).toBe(true);
      if (!layer) act({ kind: "deeper" });
    }
    act({ kind: "chamber" });
    act({ kind: "verify" });
    act({ kind: "allocate", allocation: "private" });
    act({ kind: "return" });
    act({ kind: "leave" });
    expect(s.lizhao.reagent).toBe(2);
    expect(s.lizhao.recipeVerified).toBe(true);
  }, 60000);
