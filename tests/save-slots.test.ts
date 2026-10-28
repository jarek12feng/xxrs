import "fake-indexeddb/auto";
import { beforeEach, expect, it } from "vitest";
import { createGame, dispatch } from "../src/core";
import { save, load } from "../src/save";
import { listSlots, readSlot, writeSlot } from "../src/save-slots";
beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.deleteDatabase("cultivation-life");
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
});
it("manual slots preserve exact state and RNG independently of autosave", async () => {
  const a = createGame("旧旅程", "wood", 87);
  await writeSlot("manual-1", a);
  const b = dispatch(a, {
    id: "next",
    type: "advance",
    activity: "work",
    months: 1,
  });
  await save(b);
  expect(await readSlot("manual-1")).toEqual(a);
  expect((await load()).state).toEqual(b);
  await save(await readSlot("manual-1"));
  expect((await load()).state).toEqual(a);
});
it("new-character archives remain independently loadable", async () => {
  const a = createGame("旧旅程", "wood", 87);
  await writeSlot("archive-test", a);
  await save(createGame("新旅程", "wood", 98));
  expect(await readSlot("archive-test")).toEqual(a);
  expect((await listSlots())[0]?.slot?.state.name).toBe("旧旅程");
});
it("unknown slot envelopes cannot be overwritten or loaded", async () => {
  await save(createGame("自动", "wood"));
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.open("cultivation-life", 1);
    r.onsuccess = () => {
      const db = r.result;
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put({ format: 999 }, "slot:manual-1");
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
  });
  await expect(
    writeSlot("manual-1", createGame("覆盖", "wood")),
  ).rejects.toThrow();
  await expect(readSlot("manual-1")).rejects.toThrow("原文件已保留");
  expect(await listSlots()).toEqual([{ id: "manual-1", slot: null }]);
  expect((await load()).state?.name).toBe("自动");
});
