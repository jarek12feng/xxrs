import { expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { currentLandmark, routeNodes, presences } from "../src/landmarks";
import { sceneMusic } from "../src/local-music";
import { mistCheckpoint } from "../tools/mist-checkpoint";
it("keeps map reading pure and only offers the existing investigated route", () => {
  const s = createGame("旅人", "wood", 42),
    snapshot = JSON.stringify(s);
  expect(currentLandmark(s).title).toBe("雨夜渡口");
  expect(
    routeNodes(s).find((n) => n.key === "apothecary")?.intent,
  ).toBeUndefined();
  expect(JSON.stringify(s)).toBe(snapshot);
  const found = dispatch(s, {
    id: "clue",
    type: "adventure",
    action: "inspect",
  });
  const node = routeNodes(found).find((n) => n.key === "apothecary")!;
  expect(node.intent).toEqual({ type: "adventure", action: "depart" });
  const arrived = dispatch(found, { ...node.intent!, id: "travel" });
  expect(currentLandmark(arrived).title).toBe("山门药庐");
  expect(arrived.month).toBe(found.month);
  expect(arrived.seed).toBe(found.seed);
  expect(sceneMusic(currentLandmark(found).title)).toBe("mystery");
  expect(sceneMusic(currentLandmark(arrived).title)).toBe("home");
  expect(presences[currentLandmark(arrived).title].detail).toContain("瓷碗");
});
it("does not bypass forest choices, permit travel after death or invent visits", () => {
  const s = createGame("旅人", "wood", 42);
  s.adventure.step = "forest";
  expect(routeNodes(s).find((n) => n.key === "shrine")?.intent).toBeUndefined();
  s.status = "dead";
  expect(routeNodes(s).every((n) => !n.intent)).toBe(true);
});
it("maps the actual third chapter and uses existing travel gates", () => {
  let s = mistCheckpoint();
  s = dispatch(s, { id: "letter", type: "mist", action: "receive" });
  expect(currentLandmark(s).title).toBe("不该到来的信");
  expect(routeNodes(s).find((n) => n.current)?.title).toBe("不该到来的信");
  expect(routeNodes(s).find((n) => n.key === "gate")?.intent).toBeUndefined();
  s = dispatch(s, { id: "accept", type: "mist", action: "accept" });
  expect(currentLandmark(s).title).toBe("灯下分路");
});

it("points to the market after the thank-you conversation", () => {
  const s = createGame("旅人", "wood", 42);
  s.adventure.step = "done";
  s.adventure.road.thanked = true;
  expect(currentLandmark(s).goal).toContain("山下坊市");
  expect(routeNodes(s).find((n) => n.key === "market")?.intent).toEqual({
    type: "road",
    action: "market",
  });
});
