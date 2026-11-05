import type { Move } from "../expedition/content";
export const NOTICE_MONTHS = { foundation: 120, golden: 600 } as const;
export const contestFoes = [
  {
    name: "许砚舟",
    goal: "常替药队守后路，想用这次成绩争取带队远行。",
    hp: 108,
    attack: 18,
    pattern: ["guard", "strike", "discern"] as Move[],
    tells: [
      "沉肩推掌，厚重掌风迎面压来。",
      "掌势已尽，侧身露出空当。",
      "他借石台尘影换步，脚步与身影错开。",
    ],
    after: "许砚舟记下你的应对：“往后护送远路，也许能同行。”",
  },
  {
    name: "温序",
    goal: "钻研持久行功，希望自己的药理也能经得住斗法。",
    hp: 136,
    attack: 20,
    pattern: ["discern", "strike", "guard"] as Move[],
    tells: [
      "两股灵流交错，一明一暗。",
      "回气尚未接续，身侧露出空隙。",
      "灵流合拢护住周身，近身处传来反震。",
    ],
    after: "温序把你刚才的换招画在掌心：“原来这口气还能这样接。我回去再试试。”",
  },
  {
    name: "沈砺",
    goal: "将去山外访剑，临行前想知道自己的快剑还有什么破绽。",
    hp: 150,
    attack: 23,
    pattern: ["guard", "discern", "strike"] as Move[],
    tells: [
      "剑势连成一线，正面来路被剑锋封住。",
      "剑影偏向左侧，落脚却在右边。",
      "第三剑收得太急，护身出现间隙。",
    ],
    after: "沈砺收剑一礼：“山外再见时，我们再试一场。”",
  },
] as const;
export const contestRank = (wins: number) =>
  ["切磋记名", "初露锋芒", "同门优胜", "本届魁首"][wins]!;
