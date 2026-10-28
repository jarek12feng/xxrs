import type { State } from "./world";
import { freshRoad, type Road } from "./road";
import { freshMist, type Mist } from "./mist";
export type Step =
  "invitation" | "ferry" | "apothecary" | "forest" | "shrine" | "home" | "done";
export interface Adventure {
  mist: Mist;
  road: Road;
  step: Step;
  clue: boolean;
  method: "none" | "medicine" | "guide" | "ward";
  ready: boolean;
  attempts: number;
  result: string;
}
export const freshAdventure = (old = false): Adventure => ({
  mist: freshMist(),
  road: freshRoad(),
  step: old ? "invitation" : "ferry",
  clue: false,
  method: "none",
  ready: false,
  attempts: 0,
  result: "",
});
export type AdventureAction =
  | "enter"
  | "inspect"
  | "ask"
  | "depart"
  | "medicine"
  | "guide"
  | "ward"
  | "prepare"
  | "rush"
  | "trail"
  | "shortcut"
  | "challenge"
  | "retreat"
  | "return"
  | "finish";
export const adventureScenes = {
  invitation: {
    name: "一封求助信",
    image: "/characters/luchi-ferry.png",
    mood: "rain",
    goal: "山下药工失踪。是否接下这次寻人委托？",
    body: "这是一段新增的独立寻人支线，不会重写你与陆迟已有的经历。",
  },
  ferry: {
    name: "雨夜渡口",
    image: "/characters/luchi-ferry.png",
    mood: "rain",
    goal: "调查失踪药工最后留下的痕迹。",
    body: "渡船靠岸，陆迟扶着受伤的船夫走来。药篓还在，人却没有回来。“先别往山里冲，”他递来一块湿透的布，“你看看这上面的东西。”",
  },
  apothecary: {
    name: "山门药庐",
    image: "/scenes/apothecary.jpg",
    mood: "warm",
    goal: "选择一种穿过山瘴的方法，并完成准备。",
    body: "温蘅把沾着青色粉末的布放在灯下。山瘴会扰乱感知，蛮力未必有用。你可以配药、寻找熟悉山路的人，也可以练习护体。",
  },
  forest: {
    name: "雾林旧道",
    image: "/scenes/mist-path.jpg",
    mood: "mist",
    goal: "辨认药工的路线，找到山祠。",
    body: "雾里传来断断续续的铃声。近路上有人留下脚印，另一侧却挂着药工用来标记归路的红绳。你要相信哪条线索？",
  },
  shrine: {
    name: "废弃山祠",
    image: "/characters/luchi-relic.png",
    mood: "mist",
    goal: "救出药工；若准备不足，带着情报撤回药庐。",
    body: "药工被困在倒塌的阵门后。一只守祠妖修挡住去路，却没有追杀伤者。它的目光一直停留在药篓里的灵草上。",
  },
  home: {
    name: "灯火归途",
    image: "/scenes/moon-terrace.png",
    mood: "moon",
    goal: "将药工送回山门，听听这次营救改变了什么。",
    body: "药工的女儿提着灯跑来。陆迟没有说你有多强，只说：“这次，是你把人带回来的。”药工交给你一张旧航图，图外仍有大片空白。",
  },
  done: {
    name: "听松山居",
    image: "/mountains.svg",
    mood: "warm",
    goal: "下一站：筑基，获得深入雾岭的能力。",
    body: "航图在桌上摊开。修行终于有了一个具体的去处：雾岭深处，还有药工没有走完的路。",
  },
} as const;
export function validAdventure(a: Adventure) {
  return (
    !!a &&
    Object.hasOwn(adventureScenes, a.step) &&
    typeof a.clue === "boolean" &&
    ["none", "medicine", "guide", "ward"].includes(a.method) &&
    typeof a.ready === "boolean" &&
    Number.isSafeInteger(a.attempts) &&
    a.attempts >= 0 &&
    typeof a.result === "string" &&
    a.result.length < 1000 &&
    (!a.ready || a.method !== "none") &&
    (!["apothecary", "forest", "shrine", "home", "done"].includes(a.step) ||
      a.clue) &&
    (!["home", "done"].includes(a.step) || (a.ready && a.attempts > 0))
  );
}
export function adventureOptions(
  a: Adventure,
): { action: AdventureAction; label: string }[] {
  switch (a.step) {
    case "invitation":
      return [{ action: "enter", label: "接下寻人委托 · 不重置旧进度" }];
    case "ferry":
      return [
        { action: "inspect", label: "检查药篓与布片 · 寻找线索" },
        { action: "ask", label: "询问陆迟 · 听他讲经过" },
        ...(a.clue
          ? [{ action: "depart" as const, label: "带着线索前往药庐" }]
          : []),
      ];
    case "apothecary":
      return [
        { action: "medicine", label: "请温蘅教我配避瘴药" },
        { action: "guide", label: "请陆迟同行，商量分工" },
        { action: "ward", label: "练习护体，自己开路" },
        ...(a.method !== "none"
          ? [
              {
                action: "prepare" as const,
                label: a.ready
                  ? "准备已妥"
                  : {
                      medicine: "文火温养，先试一缕药气",
                      guide: "约定撤退信号，我救人，你引开守卫",
                      ward: "听着铃声稳住呼吸，再运转灵气",
                    }[a.method],
              },
              {
                action: "rush" as const,
                label: {
                  medicine: "猛火炼化，一次加足药材",
                  guide: "不用商量，到时各凭本事",
                  ward: "全力催动灵气，盖过铃声",
                }[a.method],
              },
            ]
          : []),
        {
          action: "depart",
          label: a.ready ? "准备好了，进入雾林" : "先入林调查 · 可以撤回",
        },
      ];
    case "forest":
      return [
        { action: "trail", label: "循红绳寻找药工" },
        { action: "shortcut", label: "走脚印密集的近路" },
      ];
    case "shrine":
      return [
        {
          action: "challenge",
          label: a.ready
            ? {
                medicine: "以药草安抚妖修，救出伤者",
                guide: "与陆迟分工，一人引开一人救援",
                ward: "稳住护体气息，穿过阵门救人",
              }[a.method as "medicine" | "guide" | "ward"]
            : "尝试闯入 · 尚未做好准备",
        },
        { action: "retreat", label: "带着情报回药庐准备" },
      ];
    case "home":
      return [{ action: "return", label: "护送药工回家 · 看见营救的结果" }];
    case "done":
      return [{ action: "finish", label: "展开修行与山河 · 追寻航图上的远方" }];
  }
}
export function runAdventure(
  input: State,
  action: AdventureAction,
  id: string,
): State {
  if (
    input.status !== "alive" ||
    input.pending ||
    input.social.scene ||
    input.social.arena.duel ||
    !adventureOptions(input.adventure).some((o) => o.action === action)
  )
    return input;
  const s = structuredClone(input),
    a = s.adventure;
  a.result = "";
  switch (action) {
    case "enter":
      a.step = "ferry";
      break;
    case "inspect":
      a.clue = true;
      a.result =
        "布片上是青瘴粉，不是血。药篓里夹着红绳：药工沿途系绳，防止在雾中迷路。";
      break;
    case "ask":
      a.result =
        "陆迟：脚印多的地方未必安全，有人专门踩出假路。先去找温蘅辨认瘴气，我会在山口等你。";
      break;
    case "depart":
      a.step = a.step === "ferry" ? "apothecary" : "forest";
      break;
    case "medicine":
    case "guide":
    case "ward":
      a.method = action;
      a.ready = false;
      a.result = {
        medicine: "温蘅拿出练习药材。你负责辨认三味药，她负责纠正火候。",
        guide: "陆迟把红绳系在你腕上：“扯两下就是退，别在雾里喊，声音传不远。”",
        ward: "温蘅摇响一串铜铃。你闭目调息，铃声一乱，护体灵气便跟着晃动。",
      }[action];
      break;
    case "prepare":
      if (a.ready) return input;
      a.ready = true;
      a.result = "准备完成。你已经掌握这一种应对山瘴的方法，可以回雾林再试。";
      break;
    case "rush":
      a.ready = false;
      a.result =
        "方法不对。温蘅提醒你：“停，气息乱了。把手放下，跟着我的铃声重新来。”可以重新尝试，不消耗你的资源。";
      break;
    case "trail":
      a.step = "shrine";
      a.result =
        "红绳通向山祠。你听见药工的呼救，也发现妖修是在守护阵门，并非无差别伤人。";
      break;
    case "shortcut":
      a.step = "shrine";
      a.ready = false;
      a.result =
        "近路是诱导闯入者的假道。你在瘴气中迷失，原先的准备被打乱；但找到了山祠，可以撤回重新准备。";
      break;
    case "challenge":
      a.attempts++;
      if (!a.ready) {
        a.result =
          "山瘴打断了你的动作。你退回祠门，没有失去线索。回药庐配药、请人同行或练护体后再来。";
      } else {
        a.step = "home";
        a.result = {
          medicine:
            "妖修嗅到避瘴药的气息，放下戒备。你救起药工，并答应不再采走祠边的幼株。",
          guide:
            "陆迟在门外引开妖修，你沿着事先商量的路线救出药工。两人都平安退回。",
          ward: "你稳住呼吸，顶住阵门散出的瘴气，将伤者背出。妖修见你没有夺宝，也没有追来。",
        }[a.method as "medicine" | "guide" | "ward"];
      }
      break;
    case "retreat":
      a.step = "apothecary";
      a.result =
        "带回情报不是白走一趟。你知道了危险来自山瘴，也知道药工还活着。";
      break;
    case "return":
      a.step = "done";
      s.stones += 12;
      if (a.method === "medicine") s.study = Math.min(4, s.study + 1);
      if (a.method === "guide") s.sense = Math.min(12, s.sense + 1);
      if (a.method === "ward") s.foundation = Math.min(24, s.foundation + 2);
      a.result =
        "获得灵石 12。" +
        {
          medicine: "从配药中学到辨药心得 +1（上限 4）。",
          guide: "与陆迟分工练就观察力，神识 +1（上限 12）。",
          ward: "护体实践使根基 +2（上限 24）。",
          none: "",
        }[a.method] +
        "药工留下旧航图：筑基后可循山河见闻，深入回春谷、雾岭与雾海。";
      break;
    case "finish":
      return input;
  }
  s.seen = [...s.seen, id].slice(-512);
  s.log.unshift({
    month: s.month,
    text: `寻人·${adventureScenes[a.step].name}：${a.result || adventureScenes[a.step].goal}`,
    kind: "story",
  });
  s.log = s.log.slice(0, 180);
  return s;
}
