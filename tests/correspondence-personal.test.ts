import { beforeAll, expect, it } from "vitest";
import {
  dispatch,
  migrateSave,
  validState,
  createGame,
  type State,
} from "../src/core";
import { goldenLateCheckpoint } from "../tools/golden-completion-checkpoint";
import {
  correspondenceQuote,
  deliverMessages,
} from "../src/correspondence/rules";
import {
  personalContacts,
  personalReplies,
  pendingPersonal,
  type WriteAction,
} from "../src/correspondence/personal";
import { reunionLetterEcho } from "../src/correspondence/history";
import { messageThreads } from "../src/correspondence/view";
let base: State;
beforeAll(() => {
  base = goldenLateCheckpoint();
}, 30000);
const greeting: WriteAction = {
  kind: "write",
  recipient: "su",
  topic: "greeting",
};
const send = (s: State, a: WriteAction = greeting, id = "personal-test") =>
  dispatch(s, { type: "correspondence", action: a, id });
it("只向已有联系写信，重复命令与新命令均不能刷信或奖励", () => {
  const fresh = createGame("初行", "wood", 42);
  expect(personalContacts(fresh)).toEqual([]);
  expect(send(fresh)).toBe(fresh);
  const s = send(base);
  expect(s).not.toBe(base);
  expect(validState(s)).toBe(true);
  expect(send(base)).toEqual(s);
  expect(send(s)).toBe(s);
  expect(send(s, greeting, "repeat")).toBe(s);
  expect(s.month).toBe(base.month);
  expect(s.seed).toBe(base.seed);
  expect(s.goldenStory).toEqual(base.goldenStory);
  expect(s.social).toEqual(base.social);
  expect(s.correspondence.letters.at(-1)?.read).toBe(true);
  expect(pendingPersonal(s, "su")).toBe(true);
  expect(personalReplies(s)).toEqual([]);
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
});
it("随游戏年月送回音，独立未读、分组、不重复投递，同阶段不能反复问候", () => {
  const s = send(base);
  s.month += 1; // isolate delivery clock; full progression covered below
  deliverMessages(s);
  const answer = s.correspondence.letters.find((l) =>
    l.id.startsWith("answer:su:"),
  )!;
  expect(answer.read).toBe(false);
  expect(answer.sender).toBe("苏婉宁");
  expect(
    messageThreads(s.correspondence.letters).find((t) => t.id === "contact:su")
      ?.letters,
  ).toHaveLength(2);
  expect(pendingPersonal(s, "su")).toBe(false);
  const before = structuredClone(s);
  deliverMessages(s);
  expect(s).toEqual(before);
  expect(correspondenceQuote(s, greeting)).toContain("已经捎去");
  expect(reunionLetterEcho(s)).toContain("报平安");
});
it("主动邀约复用古渡流程，不传送；真实测读耗月送信，见面承接已送达问候", () => {
  let s = send(base, { kind: "write", recipient: "su", topic: "invite" });
  expect(s.goldenStory.reunion.stage).toBe("invited");
  expect(s.month).toBe(base.month);
  expect(s.outerSea.location).toBe(base.outerSea.location);
  expect(validState(s)).toBe(true);
  for (const action of [
    { kind: "meet" },
    { kind: "plan", approach: "ward" },
    { kind: "anchor" },
  ] as const) {
    s = dispatch(s, {
      type: "goldenStory",
      action: { kind: "reunion", action },
      id: `personal-flow-${action.kind}`,
    });
    expect(validState(s)).toBe(true);
  }
  expect(s.month).toBeGreaterThan(base.month);
  expect(
    s.correspondence.letters.some((l) => l.id.startsWith("answer:su:invite:")),
  ).toBe(true);
  expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
});
it("失联只给驿使回执，不擅自确认人物境界、生死或亲口答复", () => {
  const s = send(base);
  s.month += 1;
  s.realm = 3;
  const gs = structuredClone(s.goldenStory);
  const answer = personalReplies(s)[0]!;
  expect(answer.sender).toBe("药路驿使");
  expect(answer.body).toContain("未能确认本人收信");
  expect(s.goldenStory).toEqual(gs);
  expect(reunionLetterEcho(s)).toBe("");
});
