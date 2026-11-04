import { ref, shallowRef, type Ref } from "vue";
import type { State } from "../core";
import { load, save } from "../save";
type Storage = { load: typeof load; save: typeof save };
/** Owns the persistence boundary: failed writes never publish candidate game state. */
export function useGameSession(
  busy: Ref<boolean>,
  stop: () => void,
  accepted: () => void,
  storage: Storage = { load, save },
) {
  const game = shallowRef<State | null>(null);
  const ready = ref(false),
    loadError = ref(false),
    notice = ref(""),
    saved = ref("");
  async function restore() {
    try {
      const result = await storage.load();
      game.value = result.state;
      saved.value = result.recovered ? "已恢复上一份备份" : "存档已读取";
      loadError.value = false;
    } catch (e) {
      loadError.value = true;
      notice.value = String(e);
    } finally {
      ready.value = true;
    }
  }
  async function persist(state: State) {
    if (busy.value) return false;
    busy.value = true;
    try {
      await storage.save(state);
      game.value = state;
      saved.value = "已自动保存";
      notice.value = "";
      accepted();
      return true;
    } catch (e) {
      notice.value = String(e);
      stop();
      return false;
    } finally {
      busy.value = false;
    }
  }
  return { game, ready, loadError, notice, saved, restore, persist };
}
