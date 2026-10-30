import type { State } from "./world";
export type Origin = "route-map" | "lamp-order";
export const originNotes = {
  "route-map": {
    title: "药庐门旁 · 改过的路图",
    body: "路图上的近路被划去，旁边补着一条沿溪的缓坡：‘背药篓者走此处，雨后再查。’落款是沈听澜。纸边还画着半块芝麻饼，油印已经透到背面。管事说，画图的人宁可多走两里，也要亲自试过坡度。",
  },
  "lamp-order": {
    title: "坊市归途 · 修好的旧灯",
    body: "药车经过路口，旧灯的光稳稳照着石阶。灯柱上留着尹照川的修单：换铜接片一枚，雨后查线槽；若再偏暗，报给坊市收件处。末尾另写着‘接手的人照此查，不必等我回来’。字迹下又补了一道检查记号。",
  },
} as const;
export function availableOrigins(s: State): Origin[] {
  const out: Origin[] = [];
  if (s.adventure.step === "apothecary") out.push("route-map");
  if (
    s.adventure.step === "done" &&
    s.adventure.road.stage === "market" &&
    s.expedition.cleared >= 1
  )
    out.push("lamp-order");
  return out;
}
export function recognizedOrigin(s: State): Origin | null {
  const key =
    s.social.gender === "male"
      ? "route-map"
      : s.social.gender === "female"
        ? "lamp-order"
        : null;
  return key && s.social.origins.includes(key) ? key : null;
}
export const companionBackground = {
  male: {
    title: "刻印铺外的山河",
    body: "沈听澜把路图翻过来，背面是几种纸的价钱。“我家开小刻印铺。小时候替人裁纸，先学会看图，后来才跟行脚的修士学吐纳、辨路。”她敲了敲尚未画满的边角：“家里劝我画些好卖的图，安稳些。我也得卖图挣路费，可总不能一辈子只画别人走过的地方。”她收起废稿：“能走到，不等于能全身回来。下次出山前，我还得把护身的本事练好。”",
  },
  female: {
    title: "把归路交到别人手里",
    body: "尹照川摊开旧灯的零件，先把能再用的放到一边。“我家在渡口撑船，小时候听水声、认灯号。后来去修阵作坊做学徒，白天干活，晚上跟着学些行气的法子。”他把检修次序写在纸上：“我也想去看远方的古阵。只是这里的灯，不能等我回来才修。”说着又伸手去接门口送来的坏灯，手停了停：“这盏先让接手的人查。我不能回回替他做完。”桌上的饭已经凉了，他笑了一下：“这个倒是没人能替我吃。”",
  },
} as const;
