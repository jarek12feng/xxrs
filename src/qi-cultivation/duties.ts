import type { Undertaking } from "./state";
export type DutyKind = Extract<Undertaking, "herbs" | "watch" | "copy">;
export const dutySituations = {
  herbs: [
    {
      clue: "病人畏寒，指尖冰凉，药碗凝着薄霜。寒气积在经脉外侧。",
      answer: "warm",
      success: "温药驱散外寒，病人的手指渐渐回暖。",
    },
    {
      clue: "病人额头发烫，口渴烦躁，脉息急促。药签注明不可再用温补药。",
      answer: "cool",
      success: "清凉药液压住热势，脉息逐渐平稳。",
    },
    {
      clue: "伤口仍在渗血，断裂的布条勒住手臂。药碗里的清热药并不能止血。",
      answer: "bind",
      success: "你清创包扎，止住出血，并把调养药另行交代。",
    },
  ],
  watch: [
    {
      clue: "山风正从缺口横扫，灯焰几乎熄灭；队伍身侧有一面可避风的石壁。",
      answer: "shelter",
      success: "队伍沿背风石壁通过，灯火没有熄灭。",
    },
    {
      clue: "浅桥已被涨水漫过，右侧旧路的高处路标仍清晰可见。",
      answer: "detour",
      success: "你带队绕上高路，避开了桥下急流。",
    },
    {
      clue: "前方是仅容一人的窄坡，后队有伤者，石桩上留着可系归绳的孔。",
      answer: "rope",
      success: "归绳系稳，你逐个接引，伤者也平安通过。",
    },
  ],
  copy: [
    {
      clue: "账页写着“桂枝八钱”，原药签却清楚记着“三钱”，两页的收药人和日期一致。",
      answer: "restore",
      success: "你以同日原签校正误字，保留了校改记号。",
    },
    {
      clue: "第二页整行被水浸去，原签也已缺失。相邻几页是不同病人的处方，不能拿来填补。",
      answer: "omit",
      success: "你标明缺文待查，没有把猜测写成药方。",
    },
    {
      clue: "两张原签日期不同，同一药名分别记了三钱与五钱；旁注分别写着初诊和复诊。",
      answer: "annotate",
      success: "你保留两次用量并注明先后，避免将复诊处方误作抄错。",
    },
  ],
} as const;
export const dutyOptions = {
  herbs: [
    ["warm", "温药散寒"],
    ["cool", "清药退热"],
    ["bind", "清创包扎"],
  ],
  watch: [
    ["shelter", "沿背风石壁护灯通过"],
    ["detour", "循高处路标绕行"],
    ["rope", "系好归绳逐个接引"],
  ],
  copy: [
    ["restore", "据同日原签校正"],
    ["omit", "留出缺文，注明待查"],
    ["annotate", "保留两条，注明诊次"],
  ],
} as const;
export const isDuty = (k: Undertaking): k is DutyKind =>
  k === "herbs" || k === "watch" || k === "copy";
