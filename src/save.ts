import { migrateSave, validState, type State } from "./core";
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("cultivation-life", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("saves");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
function newer(value: unknown) {
  return (
    !!value &&
    typeof value === "object" &&
    "version" in value &&
    typeof value.version === "number" &&
    value.version > 8
  );
}
function read(value: unknown) {
  try {
    return migrateSave(value);
  } catch {
    return null;
  }
}
export async function load(): Promise<{
  state: State | null;
  recovered: boolean;
}> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("saves"),
      store = tx.objectStore("saves"),
      a = store.get("current"),
      b = store.get("previous");
    tx.oncomplete = () => {
      db.close();
      if (newer(a.result)) {
        reject(new Error("这是较新版本的存档，请更新游戏后读取。原档未修改。"));
        return;
      }
      const current = read(a.result),
        previous = read(b.result);
      if (current) resolve({ state: current, recovered: false });
      else if (previous) resolve({ state: previous, recovered: true });
      else if (a.result || b.result)
        reject(new Error("存档损坏，已停止自动写入。请导入有效备份。"));
      else resolve({ state: null, recovered: false });
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export async function save(state: State) {
  if (!validState(state)) throw new Error("拒绝写入非法状态");
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("saves", "readwrite"),
      store = tx.objectStore("saves"),
      old = store.get("current");
    old.onsuccess = () => {
      if (newer(old.result)) {
        tx.abort();
        return;
      }
      if (read(old.result)) store.put(old.result, "previous");
      if (
        [1, 2, 3, 4, 5, 6, 7].includes(old.result?.version) &&
        read(old.result)
      ) {
        const key = `original-v${old.result.version}`;
        const backup = store.get(key);
        backup.onsuccess = () => {
          if (!backup.result) store.put(old.result, key);
        };
      }
      store.put(structuredClone(state), "current");
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("存档事务已中止，原档未修改。"));
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
