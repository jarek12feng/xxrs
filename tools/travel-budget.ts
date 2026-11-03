import { routeBetween, sites } from "../src/wayfaring/routes";
import type { Destination } from "../src/foundation-journey/state";
const ids = Object.keys(sites) as Destination[];
console.log(
  "# 内陆旅行成本核算\n\n由当前规则自动计算。里数为游戏设计，不能替代真人节奏验收。\n",
);
console.log(
  "|起点|终点|陆路/月|筑基御剑/月|金丹御剑/月|\n|---|---|---:|---:|---:|",
);
for (let i = 0; i < ids.length; i++)
  for (let j = i + 1; j < ids.length; j++) {
    const from = ids[i]!,
      to = ids[j]!;
    console.log(
      `|${sites[from].name}|${sites[to].name}|${routeBetween(from, to, "land").months}|${routeBetween(from, to, "flight").months}|${routeBetween(from, to, "flight", 2).months}|`,
    );
  }
const route: Destination[] = [
  "home",
  "ferry",
  "estate",
  "home",
  "frontier",
  "home",
];
const total = (mode: "land" | "flight") =>
  route
    .slice(1)
    .reduce((sum, to, i) => sum + routeBetween(route[i]!, to, mode).months, 0);
console.log(
  `\n代表行程：${route.map((id) => sites[id].name).join(" → ")}。陆路 ${total("land")} 月；筑基御剑 ${total("flight")} 月，加首次研习 1 月共 ${total("flight") + 1} 月。各次播放至多 2.6 秒，可暂停或跳过。近郊过场 1.4 秒，不增加确认或世界时间。`,
);
console.log(
  "\n外海固定航路 54000 里/6 月，赴会潮路 18000 里/2 月；遗迹费用包括候潮、探路，不能按内陆行速重算。遇来信暂停后只扣剩余月份。",
);
