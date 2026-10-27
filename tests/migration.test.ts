import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { createGame as legacyGame } from "../src/legacy-v1";
import { createGame as v2Game } from "../src/legacy-v2";
import { createGame as v3Game } from "../src/chapter";
import { createGame as v4Game } from "../src/legacy-v4";
import { createGame, dispatch } from "../src/core";
import { save, load } from "../src/save";
beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const r = indexedDB.deleteDatabase("cultivation-life");
    r.onsuccess = () => resolve();
  });
});
it("keeps original-v5 intact on the first scene-aware save", async () => {
  const { adventure: _, ...state } = createGame("旧人", "wood");
  const old = { ...state, version: 5 };
  await raw("current", old);
  const migrated = (await load()).state!;
  expect(migrated.adventure.step).toBe("invitation");
  expect(await raw("current")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v5")).toEqual(old);
});
it("preserves original-v8 before writing the new letter chapter", async () => {
  const current = createGame("旧旅人", "wood");
  const { mist: _, ...adventure } = current.adventure;
  const old = { ...current, version: 8, adventure };
  await raw("current", old);
  const migrated = (await load()).state!;
  expect(migrated.version).toBe(10);
  expect(migrated.adventure.mist.stage).toBe("dormant");
  expect(await raw("current")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v8")).toEqual(old);
  expect((await load()).state).toEqual(migrated);
});
it("backs up original-v7 before persisting environmental discoveries", async () => {
  const current = createGame("旧旅人", "wood");
  const { discoveries: _, lastApproach: __, ...road } = current.adventure.road;
  const old = {
    ...current,
    version: 7,
    adventure: { ...current.adventure, road },
  };
  await raw("current", old);
  const migrated = (await load()).state!;
  expect(migrated.version).toBe(10);
  expect(migrated.adventure.road.discoveries).toEqual([]);
  expect(await raw("current")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v7")).toEqual(old);
  expect((await load()).state).toEqual(migrated);
});
it("keeps original-v6 intact before saving the new road chapter", async () => {
  const current = createGame("旧旅人", "wood");
  const { road: _, ...adventure } = current.adventure;
  const old = { ...current, version: 6, adventure };
  await raw("current", old);
  const migrated = (await load()).state!;
  expect(migrated.version).toBe(10);
  expect(migrated.adventure.step).toBe(old.adventure.step);
  expect(await raw("current")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v6")).toEqual(old);
});
it("preserves the original v4 save while migrating social data", async () => {
  const old = v4Game("旧世", "wood", 3);
  await raw("current", old);
  const upgraded = (await load()).state!;
  expect(upgraded.version).toBe(10);
  expect(upgraded.social.gender).toBeNull();
  expect(await raw("current")).toEqual(old);
  await save(upgraded);
  expect(await raw("original-v4")).toEqual(old);
});
async function raw(key: string, value?: unknown) {
  return new Promise<unknown>((resolve, reject) => {
    const r = indexedDB.open("cultivation-life", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("saves");
    r.onsuccess = () => {
      const db = r.result,
        tx = db.transaction(
          "saves",
          value === undefined ? "readonly" : "readwrite",
        ),
        store = tx.objectStore("saves");
      const q = value === undefined ? store.get(key) : store.put(value, key);
      tx.oncomplete = () => {
        db.close();
        resolve(q.result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
it("does not rewrite v1 on read; permanently preserves original when starting chapter", async () => {
  const old = legacyGame("旧人", "spirit", 42);
  await raw("current", old);
  const loaded = (await load()).state!;
  expect(loaded.status).toBe("legacy");
  expect(await raw("current")).toEqual(old);
  expect(await raw("original-v1")).toBeUndefined();
  const next = dispatch(loaded, {
    id: "start",
    type: "beginChapter",
    path: "wood",
  });
  await save(next);
  await save(
    dispatch(next, {
      id: "work",
      type: "advance",
      activity: "work",
      months: 1,
    }),
  );
  expect(await raw("original-v1")).toEqual(old);
  expect((await load()).state?.archive).toEqual(old);
});
it("refuses future saves instead of silently loading older previous snapshot", async () => {
  await raw("previous", createGame("甲", "wood"));
  const future = { version: 99, important: "keep" };
  await raw("current", future);
  await expect(load()).rejects.toThrow("较新");
  await expect(save(createGame("乙", "sword"))).rejects.toThrow();
  expect(await raw("current")).toEqual(future);
});
it("reports unrecoverable corruption without modifying raw data", async () => {
  const broken = { version: 2, broken: true };
  await raw("current", broken);
  await expect(load()).rejects.toThrow("损坏");
  expect(await raw("current")).toEqual(broken);
});
it("rejects invalid writes before touching the database", async () => {
  const valid = createGame("甲", "wood");
  await save(valid);
  await expect(save({ ...valid, qi: -1 })).rejects.toThrow("非法");
  expect(await raw("current")).toEqual(valid);
});

it("upgrades v2 without resetting progress and preserves its first original snapshot", async () => {
  const old = v2Game("筑基旧人", "sword", 88);
  old.month = 2;
  old.age += 2;
  old.qi = 28;
  await raw("current", old);
  const upgraded = (await load()).state!;
  expect(upgraded.version).toBe(10);
  expect(upgraded.qi).toBe(28);
  expect(upgraded.seed).toBe(88);
  expect(await raw("current")).toEqual(old);
  await save(upgraded);
  await save(
    dispatch(upgraded, {
      id: "after-upgrade",
      type: "advance",
      activity: "work",
      months: 1,
    }),
  );
  expect(await raw("original-v2")).toEqual(old);
  expect((await load()).state?.pending?.kind).toBe("meeting");
});

it("preserves original v3 and reloads v4 world and queued work exactly", async () => {
  const old = v3Game("旧档", "wood", 89);
  await raw("current", old);
  let s = (await load()).state!;
  s = dispatch(s, {
    id: "queue",
    type: "enqueue",
    action: "gather",
    repeat: 6,
  });
  s = dispatch(s, { id: "tick", type: "queueTick" });
  await save(s);
  expect(await raw("original-v3")).toEqual(old);
  expect((await load()).state).toEqual(s);
  expect(s.journey.queue[0].remaining).toBe(5);
  await save(dispatch(s, { id: "second", type: "queueTick" }));
  expect(await raw("original-v3")).toEqual(old);
});

it("preserves original-v9 before recording a different road solution", async () => {
  const current = createGame("守路人", "wood");
  const { solution: _, prepared: __, ...road } = current.adventure.road;
  const old = {
    ...current,
    version: 9,
    adventure: { ...current.adventure, road },
  };
  await raw("current", old);
  const migrated = (await load()).state!;
  expect(migrated.version).toBe(10);
  expect(migrated.adventure.road.solution).toBe("none");
  expect(await raw("current")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v9")).toEqual(old);
  await save(migrated);
  expect(await raw("original-v9")).toEqual(old);
  expect((await load()).state).toEqual(migrated);
});
