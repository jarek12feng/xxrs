import "fake-indexeddb/auto";
import { beforeEach, it, expect } from "vitest";
import { createGame as legacyGame } from "../src/legacy-v1";
import { createGame as v2Game } from "../src/legacy-v2";
import { createGame, dispatch } from "../src/core";
import { save, load } from "../src/save";
beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const r = indexedDB.deleteDatabase("cultivation-life");
    r.onsuccess = () => resolve();
  });
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
  expect(upgraded.version).toBe(3);
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
