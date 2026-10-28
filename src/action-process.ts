import type { Intent } from "./core";
export interface ActionProcess {
  kind: "medicine" | "sword" | "array" | "investigate" | "talk";
  title: string;
  beats: [string, string, string];
}
const medicine: ActionProcess = {
  kind: "medicine",
  title: "药气入脉",
  beats: [
    "拨开湿泥，露出发黑的根须。",
    "掌心药气沿着细根缓缓下沉。",
    "石缝里传来一声轻响，你收住灵息。",
  ],
};
const array: ActionProcess = {
  kind: "array",
  title: "循纹接阵",
  beats: [
    "指尖沿刻痕游走，辨认断开的灵路。",
    "灵石逐一落位，阵纹随呼吸亮起。",
    "错乱的回声渐渐合拍，你稳住最后一处阵眼。",
  ],
};
export function actionProcess(intent: Intent): ActionProcess | undefined {
  if (intent.type === "road") {
    if (intent.action === "healPass") return medicine;
    if (intent.action === "cutPass")
      return {
        kind: "sword",
        title: "剑指风口",
        beats: [
          "你立定脚跟，剑锋贴着断崖抬起。",
          "风压在剑脊上，衣袖猛地绷紧。",
          "一道剑光掠过岩壁，碎石声落向云底。",
        ],
      };
    if (intent.action === "restorePass") return array;
    if (
      [
        "diagnoseRoots",
        "markCut",
        "traceArray",
        "examineLedger",
        "examineMarks",
        "examineNames",
      ].includes(intent.action)
    )
      return {
        kind: "investigate",
        title: "细察眼前",
        beats: [
          "你停下脚步，将眼前的痕迹看仔细。",
          "风声间歇，原先忽略的细节显露出来。",
          "你在路簿上留下几笔，对照方才所见。",
        ],
      };
  }
  if (intent.type === "mist") {
    if (["tend", "attune"].includes(intent.action)) return medicine;
    if (["decode", "illuminate"].includes(intent.action)) return array;
    if (intent.action === "caravanBridge")
      return {
        kind: "investigate",
        title: "牵索架桥",
        beats: [
          "药队将绳索绕过桥桩，你扶住松动的木梁。",
          "绳结一寸寸收紧，桥身在雾中轻晃。",
          "你压低重心踏上桥板，听脚下的回响。",
        ],
      };
  }
  if (intent.type === "adventure" && intent.action === "prepare")
    return {
      kind: "investigate",
      title: "山行之前",
      beats: [
        "你摊开行囊，把要用的东西放到手边。",
        "照着方才学过的法子，反复试了几遍。",
        "你收拢行装，望向山口的薄雾。",
      ],
    };
  return undefined;
}
