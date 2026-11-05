import { describe, expect, it } from "vitest";
import {
  createGame,
  dispatch,
  migrateSave,
  validState,
  type State,
} from "../src/core";
import { SAVE_VERSION } from "../src/save-version";
import {
  correspondenceQuote,
  deliverMessages,
  messageStatus,
  type CorrespondenceAction,
} from "../src/correspondence/rules";
import { messageSources } from "../src/correspondence/sources";
import { validCorrespondence } from "../src/correspondence/state";
import { auctionFixture } from "../tools/auction-checkpoint";
import { finishPactTrial } from "../tools/foundation-pact-policy";
import {
  journeyCheckpoint,
  journeyPlayer,
} from "../tools/foundation-journey-checkpoint";
const mail = (
  s: State,
  action: CorrespondenceAction,
  id = `mail:${s.seen.length}:${action.kind}`,
) => dispatch(s, { type: "correspondence", action, id });
function invitation() {
  const p = journeyPlayer(journeyCheckpoint());
  p.act({ kind: "travel", destination: "ferry" });
  return p.state;
}
describe("传讯与旧信", () => {
  it("新角色无凭空来信，纯投影不改状态或随机种子", () => {
    const s = createGame("初行", "wood", 42),
      before = structuredClone(s);
    expect(messageSources(s)).toEqual([]);
    expect(mail(s, { kind: "collect" })).toBe(s);
    expect(s).toEqual(before);
    expect(validState(s)).toBe(true);
  });
  it("读信不接约，回信复用原规则；婉拒后可改约且不扣时、不传送", () => {
    let s = invitation();
    expect(validState(s)).toBe(true);
    expect(
      s.correspondence.letters.some((l) => l.id === "pact:invitation"),
    ).toBe(true);
    expect(mail(s, { kind: "accept", letter: "pact:invitation" })).toBe(s);
    const before = structuredClone(s);
    s = mail(s, { kind: "read", letter: "pact:invitation" });
    expect(s.secretPact.stage).toBe("none");
    s = mail(s, { kind: "decline", letter: "pact:invitation" });
    expect(s.secretPact.stage).toBe("declined");
    s = mail(s, { kind: "accept", letter: "pact:invitation" }, "accept-once");
    expect(s.secretPact.stage).toBe("promised");
    expect(s.month).toBe(before.month);
    expect(s.seed).toBe(before.seed);
    expect(s.foundationJourney.location).toBe("ferry");
    expect(s.secretPact.site).toBe("away");
    expect(s.correspondence.letters.some((l) => l.id === "pact:accepted")).toBe(
      true,
    );
    expect(
      mail(s, { kind: "accept", letter: "pact:invitation" }, "accept-once"),
    ).toBe(s);
    expect(
      mail(s, { kind: "accept", letter: "pact:invitation" }, "accept-twice"),
    ).toBe(s);
    expect(validState(s)).toBe(true);
    expect(migrateSave(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it("来信约定经真实旅行与险阵完成，结果回信只送一次", () => {
    const p = journeyPlayer(invitation());
    p.send({
      type: "correspondence",
      action: { kind: "read", letter: "pact:invitation" },
    });
    p.send({
      type: "correspondence",
      action: { kind: "accept", letter: "pact:invitation" },
    });
    p.fight("well");
    p.act({ kind: "inherit", technique: "spring" });
    p.fight("application");
    p.cultivate(200);
    p.fight("exit");
    p.act({ kind: "ferryOutcome", outcome: "escort" });
    p.act({ kind: "travel", destination: "frontier" });
    while (p.state.stones < 100)
      p.send({ type: "advance", activity: "work", months: 12 });
    p.act({ kind: "routePrepare", route: "frontier", method: "service" });
    p.act({ kind: "routeChoose", route: "frontier", choice: "careful" });
    p.fight("frontier");
    const before = p.state.month;
    finishPactTrial(p);
    expect(p.state.month).toBeGreaterThan(before);
    expect(p.state.secretPact.trial).toBe("complete");
    expect(
      p.state.correspondence.letters.filter((l) => l.id === "pact:completed"),
    ).toHaveLength(1);
    expect(
      messageStatus(
        p.state,
        p.state.correspondence.letters.find((l) => l.id === "pact:invitation")!,
      ),
    ).toBe("此行已完成");
    expect(validState(p.state)).toBe(true);
    expect(
      migrateSave(JSON.parse(JSON.stringify(p.state))).correspondence,
    ).toEqual(p.state.correspondence);
  });
  it("已在旧入口答应的约定立即反映在信上，不重复约定", () => {
    let s = invitation();
    const l = s.correspondence.letters.find((l) => l.id === "pact:invitation")!;
    s = dispatch(s, { type: "secretPact", action: "promise", id: "old-entry" });
    expect(messageStatus(s, l)).toContain("已约");
    expect(
      correspondenceQuote(s, { kind: "accept", letter: l.id }),
    ).toBeTruthy();
  });
  it("拍卖需先建立目录信路，跨年只收当前会讯，阅读不重抽目录", () => {
    let s = auctionFixture();
    expect(messageSources(s).some((l) => l.id.startsWith("auction:"))).toBe(
      false,
    );
    s = dispatch(s, {
      type: "treasure",
      action: { kind: "catalog", venue: "market" },
      id: "catalog",
    });
    const l = s.correspondence.letters.find(
      (l) => l.id === "auction:market:1",
    )!;
    expect(l.body).toContain("第12月开场");
    const old = structuredClone(l),
      seed = s.seed,
      catalog = structuredClone(s.treasures.auction);
    s = mail(s, { kind: "read", letter: l.id });
    s = mail(s, { kind: "follow", letter: l.id });
    expect(s.seed).toBe(seed);
    expect(s.treasures.auction).toEqual(catalog);
    s.month = 120;
    s.age = 312;
    s = mail(s, { kind: "collect" });
    expect(
      s.correspondence.letters
        .filter((l) => l.id.startsWith("auction:"))
        .map((l) => l.id),
    ).toEqual(["auction:market:1", "auction:market:10"]);
    expect(s.correspondence.letters[0]!.body).toBe(old.body);
    expect(messageStatus(s, s.correspondence.letters[0]!)).toContain("已过");
    expect(mail(s, { kind: "collect" }, "again")).toBe(s);
    expect(validState(s)).toBe(true);
  });
  it("关闭旧届即显示散场，关注不造成隐式代拍或闭关门禁", () => {
    let s = auctionFixture();
    s = dispatch(s, {
      type: "treasure",
      action: { kind: "catalog", venue: "market" },
      id: "catalog",
    });
    const l = s.correspondence.letters[0]!;
    s = mail(s, { kind: "follow", letter: l.id });
    s = dispatch(s, {
      type: "treasure",
      action: { kind: "leave" },
      id: "leave",
    });
    expect(messageStatus(s, l)).toBe("本届已散场");
    expect(s.treasures.auction!.lots.every((l) => l.paid === 0)).toBe(true);
  });
  it("战斗、事件、旅行及寿终期间不可回信，旧信不绕过现场规则", () => {
    const s = invitation();
    for (const mutate of [
      (n: State) => {
        n.status = "dead";
      },
      (n: State) => {
        n.pending = { id: "pending", kind: "meeting" } as State["pending"];
      },
      (n: State) => {
        n.foundationJourney.duel = {
          id: "well",
        } as State["foundationJourney"]["duel"];
      },
      (n: State) => {
        n.wayfaring.trip = {} as State["wayfaring"]["trip"];
      },
    ]) {
      const n = structuredClone(s);
      mutate(n);
      expect(mail(n, { kind: "read", letter: "pact:invitation" })).toBe(n);
      expect(mail(n, { kind: "accept", letter: "pact:invitation" })).toBe(n);
    }
  });
  it("诸宗会通知使用告知后的五十年会期，旧信不随世界变化改写", () => {
    const s = invitation();
    s.outerSea.notice = 120;
    const source = messageSources(s).find(
      (l) => l.id === "conclave:notice:720",
    )!;
    expect(source.body).toContain("第720月");
    s.foundationJourney.rescue = 1;
    deliverMessages(s);
    const request = s.correspondence.letters.find(
      (l) => l.id === "rescue:request",
    )!;
    const body = request.body;
    s.foundationJourney.rescue = 4;
    deliverMessages(s);
    expect(messageStatus(s, request)).toContain("已完成");
    expect(request.body).toBe(body);
    expect(
      s.correspondence.letters.some((l) => l.id === "rescue:resolved"),
    ).toBe(true);
  });
  it("迁移 v46 仅补空信册，不补历史；损坏和未来档拒绝", () => {
    const s = invitation();
    const { correspondence: _, ...rest } = s;
    const old = { ...rest, version: 46 },
      copy = structuredClone(old);
    const n = migrateSave(old);
    expect(n.version).toBe(SAVE_VERSION);
    expect(n.correspondence.letters).toEqual([]);
    expect(n.secretPact).toEqual(s.secretPact);
    expect(old).toEqual(copy);
    expect(validState(n)).toBe(true);
    expect(() => migrateSave({ ...n, version: SAVE_VERSION + 1 })).toThrow();
    expect(() => migrateSave({ ...n, correspondence: undefined })).toThrow();
    expect(() => migrateSave({ ...old, month: -1 })).toThrow();
  });
  it("拒绝重复ID、未来收信时间、伪响应和畸形信件", () => {
    const s = invitation(),
      l = s.correspondence.letters[0]!;
    expect(validCorrespondence({ letters: [l, l] }, s.month)).toBe(false);
    for (const change of [
      { received: s.month + 1 },
      { response: "accepted", read: false },
      { body: {} },
      { expires: s.month },
      { id: "<script>" },
    ])
      expect(
        validCorrespondence({ letters: [{ ...l, ...change }] }, s.month),
      ).toBe(false);
    expect(validCorrespondence(null, s.month)).toBe(false);
  });
  it("固定操作序列重放相同，送达和收藏在正常推进后保留", () => {
    function replay() {
      let s = invitation();
      s = mail(s, { kind: "read", letter: "pact:invitation" }, "read");
      s = mail(s, { kind: "follow", letter: "pact:invitation" }, "follow");
      s = dispatch(s, {
        type: "advance",
        activity: "work",
        months: 1,
        id: "work",
      });
      expect(s.correspondence.letters[0]!.followed).toBe(true);
      return s;
    }
    expect(replay()).toEqual(replay());
  });
});
