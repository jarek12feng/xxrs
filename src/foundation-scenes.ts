import type { State as ChapterState } from "./chapter";
import type { ActionProcess } from "./action-process";
type State = Omit<ChapterState, "version">;
const passages: Record<string, ActionProcess> = {
  sense: {
    kind: "array",
    title: "看见阵眼",
    beats: [
      "你闭目凝神，从纷乱剑光中辨出一处不动的暗点。",
      "灵息循着暗点穿入，石门上的剑光逐道熄灭。",
      "门扇松开。那些凝神的日子，终于换来一条无伤的路。",
    ],
  },
  decipher: {
    kind: "array",
    title: "残诀成路",
    beats: [
      "你认出石门残诀中反复研读过的运气次序。",
      "三处断纹接续，原本相冲的灵流慢慢分开。",
      "石门向内转动。你将最后一句残诀记下，踏入丹室。",
    ],
  },
  medicine: {
    kind: "medicine",
    title: "四株草，一条路",
    beats: [
      "你取出备好的四株灵草，揉碎药叶。",
      "药气融入毒瘴，眼前现出石阶的边沿。",
      "你沿阶走过瘴幕，收起空药包，推开丹室的门。",
    ],
  },
  blade: {
    kind: "sword",
    title: "剑开石门",
    beats: [
      "你握住旧剑，将历练所得的剑意压在锋上。",
      "剑光撞开封门的阵纹，反震沿手臂直入肩头。",
      "你忍住伤痛收剑。门开了，这一剑也留下了一道伤。",
    ],
  },
  endure: {
    kind: "array",
    title: "扛住阵压",
    beats: [
      "你沉肩站稳，将灵息护住胸背。",
      "石阵的重压落下，你一步步踏过裂开的石阶。",
      "走出阵门时，肩背仍在作痛；丹室已经近在眼前。",
    ],
  },
  memory: {
    kind: "investigate",
    title: "旧路仍在",
    beats: [
      "梦里那处缺角，与眼前的石阶重合。",
      "你避开明亮的阵纹，沿记忆中的窄路前行。",
      "跨过最后一道石缝，丹室的门就在面前。",
    ],
  },
  protect: {
    kind: "array",
    title: "护体过阵",
    beats: [
      "你将筑基灵息展开，稳住石门外的乱流。",
      "剑光擦过护体灵息，未能再逼退你的脚步。",
      "你护住陆迟走入丹室，把石门留在身后。",
    ],
  },
};
export function foundationPassageScene(s: State) {
  return passages[s.memories.crossing];
}
export function foundationReunion(s: State): string | null {
  if (!s.realm || s.story.luchi !== "foundation" || s.story.choice !== "gift")
    return null;
  return "陆迟收起护关的旧剑，看着你走出洞府：“当年那枚丹，让我先过了关。如今你也来了。”他把行囊系好：“我还要走自己的路。下次相见，再看看彼此走了多远。”";
}
