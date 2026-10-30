import { expeditionSession } from "../tools/expedition-simulation";
import { expect, it } from "vitest";
import {
  createGame,
  dispatch,
  eventView,
  validState,
  migrateSave,
  type State,
  type Intent,
} from "../src/core";
import { recognizedOrigin, availableOrigins } from "../src/companion-origins";
import { actionReceipt } from "../src/action-feedback";
const send = (s: State, c: Intent) =>
  dispatch(s, { ...c, id: `origin-${s.seen.length}` });
function scene(gender: "male" | "female" | null) {
  const s = createGame("过路人", "wood", 42);
  s.social.gender = gender;
  s.adventure.step = "apothecary";
  s.adventure.clue = true;
  return s;
}
function lampScene(previous: State) {
  const p = expeditionSession();
  p.send({ type: "expedition", action: "accept" });
  p.send({ type: "expedition", action: "enter" });
  p.resolve();
  if (!p.state.expedition.duel) p.send({ type: "expedition", action: "enter" });
  p.fight();
  p.send({ type: "road", action: "market" });
  const s = p.state;
  s.social.gender = previous.social.gender;
  s.social.origins = [...previous.social.origins];
  expect(validState(s)).toBe(true);
  expect(s.expedition.cleared).toBe(1);
  return s;
}
function adult(s: State) {
  s.age = 240;
  s.month = 48;
  s.realm = 1;
  s.story.stage = "resolved";
  s.story.choice = "missed";
  s.story.luchi = "distant";
  s.memories.letter = s.memories.visit = true;
  return s;
}
const choose = (s: State, option: string) =>
  send(s, { type: "choose", instanceId: s.social.scene!.id, option });
it("both people exist before identity selection; reading is optional and does not create a relationship", () => {
  let s = scene(null);
  const snapshot = structuredClone(s);
  expect(availableOrigins(s)).toEqual(["route-map"]);
  const c = { type: "readOrigin", origin: "route-map", id: "once" } as const;
  const n = dispatch(s, c);
  expect(s).toEqual(snapshot);
  expect(n.social.origins).toEqual(["route-map"]);
  expect(n.social.met).toBe(false);
  expect(n.social.affection).toBe(0);
  expect(n.month).toBe(s.month);
  expect(n.seed).toBe(s.seed);
  expect(n.herbs).toBe(s.herbs);
  expect(n.stones).toBe(s.stones);
  expect(dispatch(n, c)).toBe(n);
  expect(send(n, { type: "readOrigin", origin: "route-map" })).toBe(n);
  expect(send(n, { type: "visit" })).toBe(n);
  s = lampScene(n);
  s = send(s, { type: "readOrigin", origin: "lamp-order" });
  expect(s.social.origins).toEqual(["route-map", "lamp-order"]);
  expect(migrateSave(s)).toEqual(s);
});
it.each(["male", "female"] as const)(
  "%s first meeting only recognizes an actually read object",
  (gender) => {
    let s = scene(gender);
    const key = gender === "male" ? "route-map" : "lamp-order";
    if (key === "lamp-order") s = lampScene(s);
    s = send(s, { type: "readOrigin", origin: key });
    const read = adult(s),
      unread = structuredClone(read);
    unread.social.origins = [];
    let met = send(read, { type: "visit" }),
      plain = send(unread, { type: "visit" });
    expect(eventView(met)!.options.some((o) => o.id === "recognize")).toBe(
      true,
    );
    expect(eventView(plain)!.options.some((o) => o.id === "recognize")).toBe(
      false,
    );
    expect(choose(plain, "recognize")).toBe(plain);
    const c = {
      type: "choose",
      instanceId: met.social.scene!.id,
      option: "recognize",
    } as const;
    const n = send(met, c);
    expect(n.social.met).toBe(true);
    expect(n.social.answers.meet).toBe("recognize");
    plain = choose(plain, "listen");
    expect(n.social.affection).toBe(plain.social.affection);
    expect(actionReceipt(met, n, c)?.person?.response).not.toContain(
      "为你守灯",
    );
    expect(validState(n)).toBe(true);
    expect(migrateSave(n)).toEqual(n);
    const oldAffection = n.social.affection,
      oldMonth = n.month;
    met = send(n, { type: "background" });
    expect(eventView(met)?.body).toContain(
      gender === "male" ? "刻印铺" : "渡口撑船",
    );
    const done = choose(met, "listen");
    expect(done.month).toBe(oldMonth);
    expect(done.social.affection).toBe(oldAffection);
    expect(validState(done)).toBe(true);
    expect(
      choose(send(done, { type: "background" }), "listen").social.affection,
    ).toBe(oldAffection);
  },
);
it("migrates real v14 without invented memories, retaining existing relationship and pending conversation", () => {
  let s = adult(scene("female"));
  s = choose(send(s, { type: "visit" }), "listen");
  s = send(s, { type: "outing", outing: "walk" });
  const { origins: _, ...social } = s.social;
  const old = { ...s, version: 14, social },
    copy = structuredClone(old);
  const n = migrateSave(old);
  expect(n.version).toBe(15);
  expect(n.social.origins).toEqual([]);
  expect(n.social.scene).toEqual(old.social.scene);
  expect(n.social.answers).toEqual(old.social.answers);
  expect(n.seed).toBe(old.seed);
  expect(old).toEqual(copy);
  expect(recognizedOrigin(n)).toBeNull();
  expect(validState({ ...n, social: { ...n.social, origins: ["fake"] } })).toBe(
    false,
  );
  expect(
    validState({
      ...n,
      social: { ...n.social, origins: ["route-map", "route-map"] },
    }),
  ).toBe(false);
  expect(() => migrateSave({ ...n, version: 16 })).toThrow();
  expect(() => migrateSave({ ...old, stones: -1 })).toThrow();
});
it("blocks remote reads, premature biography, events and terminal states", () => {
  const s = scene("male");
  s.adventure.step = "ferry";
  expect(send(s, { type: "readOrigin", origin: "route-map" })).toBe(s);
  expect(send(s, { type: "background" })).toBe(s);
  for (const status of ["dead", "complete"] as const) {
    const n = { ...s, status };
    n.adventure.step = "apothecary";
    expect(send(n, { type: "readOrigin", origin: "route-map" })).toBe(n);
  }
  s.adventure.step = "apothecary";
  s.pending = { id: "1:0:meeting", kind: "meeting" };
  expect(send(s, { type: "readOrigin", origin: "route-map" })).toBe(s);
});

it("keeps an old pledged relationship intact and allows biography without extra affection", () => {
  let s = adult(scene("male"));
  s = choose(send(s, { type: "visit" }), "listen");
  s.social.memories = ["walk", "night", "watch"];
  s.social.answers = {
    meet: "listen",
    walk: "stay",
    night: "honest",
    watch: "learn",
    pledge: "yes",
  };
  s.social.affection = 70;
  s.social.bonded = true;
  const { origins: _, ...social } = s.social;
  const n = migrateSave({ ...s, version: 14, social });
  const done = choose(send(n, { type: "background" }), "listen");
  expect(done.social.bonded).toBe(true);
  expect(done.social.affection).toBe(70);
  expect(done.social.answers.pledge).toBe("yes");
  expect(done.social.origins).toEqual([]);
  expect(validState(done)).toBe(true);
});

it("first meeting requires both adulthood and foundation, independently of optional clues", () => {
  const s = adult(scene("male"));
  s.realm = 0;
  expect(send(s, { type: "visit" })).toBe(s);
  s.realm = 1;
  s.age = 215;
  expect(send(s, { type: "visit" })).toBe(s);
  s.age = 240;
  expect(send(s, { type: "visit" }).social.scene?.kind).toBe("meet");
  expect(s.social.origins).toEqual([]);
});
