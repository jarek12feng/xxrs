import { createGame, dispatch } from "../src/core";
import { load, save } from "../src/save";
import { readSlot, writeSlot } from "../src/save-slots";
// Bundled only by the smoke-test harness; never included in the release.
(globalThis as any).desktopProbe = async (phase: string) => {
  const first = createGame("桌面存档验收", "sword", 42);
  const second = dispatch(first, {
    id: "desktop-test",
    type: "advance",
    activity: "work",
    months: 1,
  });
  if (phase === "write") {
    if ((await load()).state !== null)
      throw new Error("Test profile was not empty");
    await writeSlot("manual-1", first);
    await save(first);
    await save(second);
    return second;
  }
  if (
    phase !== "write" &&
    JSON.stringify(await readSlot("manual-1")) !== JSON.stringify(first)
  )
    throw new Error("Manual slot lost across restart");
  if (phase === "read") {
    const result = await load();
    if (
      JSON.stringify(result.state) !== JSON.stringify(second) ||
      result.recovered
    )
      throw new Error("Restart did not restore exact state");
    return result.state;
  }
  if (phase === "corrupt" || phase === "recovered") {
    if (phase === "corrupt")
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("cultivation-life", 1);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("saves", "readwrite");
          tx.objectStore("saves").put({ broken: true }, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    const result = await load();
    if (
      JSON.stringify(result.state) !== JSON.stringify(first) ||
      !result.recovered
    )
      throw new Error("Previous snapshot recovery failed");
    return result.state;
  }
  throw new Error("Unknown phase");
};
