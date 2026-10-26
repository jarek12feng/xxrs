import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { save, load } from "../src/save";
beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase("cultivation-life");
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
});
describe("save snapshots", () => {
  it("restores the exact state and RNG after reload", async () => {
    const a = dispatch(createGame("存档", "wood", 87), {
      id: "tick",
      type: "advance",
      activity: "work",
      months: 12,
    });
    await save(a);
    expect(await load()).toEqual({ state: a, recovered: false });
  });
  it("falls back to the previous snapshot if current is corrupt", async () => {
    const a = createGame("备份", "wood");
    await save(a);
    await save(
      dispatch(a, { id: "tick", type: "advance", activity: "work", months: 1 }),
    );
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("cultivation-life", 1);
      r.onsuccess = () => {
        const db = r.result,
          tx = db.transaction("saves", "readwrite");
        tx.objectStore("saves").put({ broken: true }, "current");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    expect(await load()).toEqual({ state: a, recovered: true });
  });
  it("starts empty without fabricating a save", async () => {
    expect(await load()).toEqual({ state: null, recovered: false });
  });
});
