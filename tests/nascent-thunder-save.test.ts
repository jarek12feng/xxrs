import { beforeAll, it, expect } from "vitest";
import { migrateSave, validState, type State } from "../src/core";
import {
  goldenLateCheckpoint,
  finishGoldenCompletion,
} from "../tools/golden-completion-checkpoint";
import { freshThunderPath } from "../src/nascent-soul/thunder-state";
let points: Record<string, State>, done: State;
beforeAll(() => {
  const result = finishGoldenCompletion(goldenLateCheckpoint());
  points = result.checkpoints;
  done = result.state;
});
function old(s: State) {
  const result = JSON.parse(JSON.stringify(s));
  result.version = 39;
  delete result.nascentSoul.thunder;
  delete result.spirit;
  return result;
}
it("v39行功退回已服丹药，保留时间与原存档，补齐新准备", () => {
  const input = old(points["nascent-phase-0"]!);
  const before = JSON.stringify(input);
  const n = migrateSave(input);
  expect(n.nascentSoul.attempt).toBeNull();
  expect(n.nascentSoul.pills).toBe(input.nascentSoul.pills + 1);
  expect(n.month).toBe(input.month);
  expect(n.nascentSoul.thunder).toEqual(freshThunderPath());
  expect(JSON.stringify(input)).toBe(before);
  expect(validState(n)).toBe(true);
});
it("v39已凝婴保留境界，不伪造渡劫历史或重复增寿", () => {
  const input = old(done);
  const n = migrateSave(input);
  expect(n.realm).toBe(3);
  expect(n.limit).toBe(done.limit);
  expect(n.nascentSoul.thunder).toEqual({
    ...freshThunderPath(),
    legacyCompleted: true,
  });
  expect(validState(n)).toBe(true);
});
it("当前天劫逐合存档可恢复，不接受负气势或跨境界进行中的雷劫", () => {
  const s = points["thunder-start"]!;
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  const broken = structuredClone(s);
  broken.nascentSoul.thunder.battle!.hp = -1;
  expect(validState(broken)).toBe(false);
  const fake = structuredClone(s);
  fake.realm = 3;
  expect(validState(fake)).toBe(false);
});
