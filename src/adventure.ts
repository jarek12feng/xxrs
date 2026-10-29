import { validAdventureV10 } from "./legacy-adventure-v10";
import type { State } from "./world";
import { freshRoad, type Road } from "./road";
import { freshMist, type Mist } from "./mist";
export type Step =
  "invitation" | "ferry" | "apothecary" | "forest" | "shrine" | "home" | "done";
export interface Adventure {
  rescueChoice: "none" | "roots" | "supplies" | "legacy";
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
  rescueChoice: "none",
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
  | "takeHerbs"
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
    body: "渡船撞上石阶，船夫攥着一只空药篓：失踪药工的东西竟从上游漂了回来，篓口还系着一个朝内的结。山里忽然响了三下铃，陆迟的手停在半空。“这铃……我父亲失踪前，也提过。”他把湿布递给你。青色痕迹正沿着布纹发亮。",
  },
  apothecary: {
    name: "山门药庐",
    image: "/scenes/apothecary.jpg",
    mood: "warm",
    goal: "选择一种穿过山瘴的方法，并完成准备。",
    body: "温蘅将布放近灯火，青痕竟逆着火光缩回去。“不是毒血，是旧阵的灵尘。有人在里面活着，还碰过阵门。”她拦住准备拔剑的陆迟：护路阵如今认不得来人，越强催灵力，反噬越重。药气可以缓阵，同伴可以分流，稳住护体也能穿过去。",
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
    body: "断裂的阵门里，药工胸前的红绳一明一灭。守祠妖修横在门口，肩上却也被阵光灼伤。它每退一步，阵里的铃便急一分。陆迟压低声音：“它是在拦我们，还是在替里面的人挡着？”阵纹又亮了，不能再等。",
  },
  home: {
    name: "归途上的药篓",
    image: "/scenes/moon-terrace.png",
    mood: "moon",
    goal: "药工已经安全。决定这篓成株留给谁，再一起回家。",
    body: "山下还有等药的伤者，祠边的成株也正要留种。药工看着药篓：“带回去，今夜就能用；留下来，明年这片山还会有药。”妖修愿教留下成株的人护根，但不会阻止你带药救人。幼株不动，两种选择都会把药工送回家。",
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
    validAdventureV10(a) &&
    ["none", "roots", "supplies", "legacy"].includes(a.rescueChoice) &&
    (a.step === "done" ? a.rescueChoice !== "none" : a.rescueChoice === "none")
  );
}
export const rescueChoices = {
  roots: {
    title: "留下成株，守住药圃",
    hint: "不领取额外灵草；留下成株养根留种，守祠妖修愿传授护根手法。山下伤者需等下一队送药。",
    echo: "守祠妖修把护根的绳结教给了你。药工说，山下伤者还要等另一队送药，但这片药圃来年仍会长。",
  },
  supplies: {
    title: "带回成株，先救眼前的人",
    hint: "获得灵草 4，可用于炼丹或交付山口伤药；药圃暂歇一季，不获护根手法。",
    echo: "温蘅收下带回的成株，先替渡口伤者敷药，再分出四株供你远行。药工答应来年回山补种，这一季药圃先空着。",
  },
} as const;
export function rescueEcho(a: Adventure): string {
  return a.rescueChoice === "roots" || a.rescueChoice === "supplies"
    ? rescueChoices[a.rescueChoice].echo
    : "";
}
export function adventureGoal(a: Adventure): string {
  if (a.step === "ferry" && a.clue)
    return "带着会随铃声发亮的青痕，去药庐请温蘅辨认。";
  if (a.step === "apothecary" && a.ready)
    return "方法已练熟。进入雾林，循药工的红绳找路。";
  if (a.step === "shrine" && !a.ready)
    return "已找到伤者；先回药庐练好方法，再来救人。";
  return adventureScenes[a.step].goal;
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
                      guide: "约定撤退信号，我救人，你稳住灵流",
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
                guide: "与陆迟分工，一人稳阵一人救援",
                ward: "稳住护体气息，穿过阵门救人",
              }[a.method as "medicine" | "guide" | "ward"]
            : "尝试闯入 · 尚未做好准备",
        },
        { action: "retreat", label: "带着情报回药庐准备" },
      ];
    case "home":
      return [
        { action: "return", label: rescueChoices.roots.title },
        { action: "takeHerbs", label: rescueChoices.supplies.title },
      ];
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
        "布片上是青瘴粉，不是血；粉末在第三声铃响时亮了一下。药篓里夹着红绳：药工沿途系绳，防止在雾中迷路。可篓口的结朝里收紧——放它下水的，似乎不是药工自己。";
      break;
    case "ask":
      a.result =
        "陆迟把一枚缺角旧印攥回掌心：“父亲说过，听见三声铃，要看绳，别追声音。可他那次没有回来。”他指向湿地：“脚印多的地方未必安全，旧阵会把人引回原地。先找温蘅辨认瘴气，我会在山口等你。”";
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
      a.result = {
        medicine:
          "文火下，药气由刺鼻变得清凉。温蘅让你封好药包：遇到守卫，先试着让它闻到这股气息。",
        guide:
          "你试着扯了两下绳，陆迟立刻退到你身旁。信号练熟了：到阵门时，他稳住灵流，你扶伤者。",
        ward: "铃声忽急忽缓，你的呼吸却稳了下来。护体已成：入阵后专注背出伤者，不追击守卫。",
      }[a.method as "medicine" | "guide" | "ward"];
      break;
    case "rush":
      a.ready = false;
      a.result =
        "方法不对。温蘅提醒你：“停，气息乱了。把手放下，跟着我的铃声重新来。”可以重新尝试，不消耗你的资源。";
      break;
    case "trail":
      a.step = "shrine";
      a.result =
        "红绳通向山祠，尽头系着一枚旧护路印，缺口竟与陆迟掌中的半印相合。阵里传来药工的呼救。守祠妖修没有追来，它正用受伤的肩膀抵住落下的阵门。";
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
            "药气顺着阵纹散开，急促的铃声终于放缓。妖修撤肩让路，你扶出药工，答应不动祠边幼株。它把另一截篓绳放在你脚下：原来药篓是它送下山求救的。",
          guide:
            "陆迟按约定牵绳分流，你沿事先商量的路线扶出药工。妖修顶住最后一道阵光，三人一同退回。它放下另一截篓绳：陆迟这才明白，药篓是它送下山求救的。",
          ward: "你稳住呼吸，护体灵气撑住断门，将伤者背出。妖修替你挡住身后阵光，随后放下另一截篓绳。原来它没有抢走药工，是把他的药篓送下山求救。",
        }[a.method as "medicine" | "guide" | "ward"];
      }
      break;
    case "retreat":
      a.step = "apothecary";
      a.result =
        "带回情报不是白走一趟。你知道了危险来自山瘴，也知道药工还活着。";
      break;
    case "return":
    case "takeHerbs":
      a.rescueChoice = action === "return" ? "roots" : "supplies";
      if (a.rescueChoice === "supplies") s.herbs += 4;
      a.step = "done";
      s.stones += 12;
      if (a.method === "medicine") s.study = Math.min(4, s.study + 1);
      if (a.method === "guide") s.sense = Math.min(12, s.sense + 1);
      if (a.method === "ward") s.foundation = Math.min(24, s.foundation + 2);
      a.result =
        rescueEcho(a) +
        (a.rescueChoice === "supplies" ? "获得灵草 4。" : "已学会护根手法。") +
        "获得灵石 12。" +
        {
          medicine: "从配药中学到辨药心得 +1（上限 4）。",
          guide: "与陆迟分工练就观察力，神识 +1（上限 12）。",
          ward: "护体实践使根基 +2（上限 24）。",
          none: "",
        }[a.method] +
        "药工留下旧航图，背面盖着同样的护路半印。“有人早年教妖修守这座阵，我只听过一个名字：陈渡。”陆迟把半印按在图上，没有追问。雾岭灵流非炼气之身能承受；要查这位修士的去向，得先筑基。";
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
