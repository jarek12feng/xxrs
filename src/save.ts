import { validState, type State } from "./core";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("cultivation-life", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("saves");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export async function load(): Promise<{
  state: State | null;
  recovered: boolean;
}> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("saves");
    const store = tx.objectStore("saves");
    const a = store.get("current"),
      b = store.get("previous");
    tx.oncomplete = () => {
      db.close();
      if (validState(a.result)) resolve({ state: a.result, recovered: false });
      else if (validState(b.result))
        resolve({ state: b.result, recovered: true });
      else if (a.result || b.result)
        reject(new Error("存档损坏，请导入备份。"));
      else resolve({ state: null, recovered: false });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function save(state: State) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("saves", "readwrite"),
      store = tx.objectStore("saves");
    const old = store.get("current");
    old.onsuccess = () => {
      if (validState(old.result)) store.put(old.result, "previous");
      store.put(structuredClone(state), "current");
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
