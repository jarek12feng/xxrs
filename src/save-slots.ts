import { migrateSave, validState, type State } from "./core";
export type SaveSlot = { format: 1; id: string; savedAt: number; state: State };
const prefix = "slot:";
async function access<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore, done: (value: T) => void) => void,
): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const r = indexedDB.open("cultivation-life", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("saves");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction("saves", mode);
    let result: T;
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("存档操作中止，原进度未修改"));
    };
    run(tx.objectStore("saves"), (value) => {
      result = value;
    });
  });
}
function decode(value: unknown, expectedId?: string): SaveSlot | null {
  if (!value || typeof value !== "object") return null;
  const v = value as SaveSlot;
  if (
    v.format !== 1 ||
    typeof v.id !== "string" ||
    (expectedId !== undefined && v.id !== expectedId) ||
    !Number.isFinite(v.savedAt)
  )
    return null;
  try {
    const state = migrateSave(v.state);
    return state ? { ...v, state } : null;
  } catch {
    return null;
  }
}
export async function listSlots() {
  return access<{ id: string; slot: SaveSlot | null }[]>(
    "readonly",
    (store, done) => {
      const items: { id: string; slot: SaveSlot | null }[] = [];
      const r = store.openCursor();
      r.onsuccess = () => {
        const c = r.result;
        if (!c) {
          done(items);
          return;
        }
        if (typeof c.key === "string" && c.key.startsWith(prefix))
          items.push({
            id: c.key.slice(prefix.length),
            slot: decode(c.value, c.key.slice(prefix.length)),
          });
        c.continue();
      };
    },
  );
}
export async function writeSlot(id: string, state: State) {
  if (!validState(state) || !/^(manual-[123]|archive-[\w-]+)$/.test(id))
    throw new Error("无效的存档");
  return access<boolean>("readwrite", (store, done) => {
    const r = store.get(prefix + id);
    r.onsuccess = () => {
      if (r.result !== undefined && !decode(r.result, id)) {
        store.transaction.abort();
        return;
      }
      store.put(
        { format: 1, id, savedAt: Date.now(), state: structuredClone(state) },
        prefix + id,
      );
      done(true);
    };
  });
}
export async function readSlot(id: string) {
  const slot = await access<SaveSlot | null>("readonly", (store, done) => {
    const r = store.get(prefix + id);
    r.onsuccess = () => done(decode(r.result, id));
  });
  if (!slot) throw new Error("无法识别或已损坏的存档，原文件已保留");
  return slot.state;
}
