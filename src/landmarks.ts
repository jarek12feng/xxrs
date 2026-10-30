// Read-only scene presentation. Travel still goes through existing core commands.
import {
  adventureScenes,
  adventureOptions,
  adventureGoal,
  roadScenes,
  roadGoal,
  roadError,
  mistScenes,
  mistGoal,
  mistError,
  type State,
  type Intent,
  type RoadAction,
  type MistAction,
} from "./core";
import { qingxuanLandmarks } from "./world-geography";
import type { SoundMood } from "./audio";
export interface Presence {
  detail: string;
  sound: string;
  weather: SoundMood;
}
export const presences: Record<string, Presence> = {
  雨夜渡口: {
    detail: "湿木栈桥在脚下轻晃。空药篓卡在石阶边，青痕只在铃响时亮起。",
    sound: "檐雨 · 渡船撞岸 · 远山三声铃",
    weather: "rain",
  },
  山门药庐: {
    detail:
      "门帘隔开了山雨。炉边烘着半湿的药布，温蘅把一只温热的瓷碗推到你手边。",
    sound: "炉火 · 捣药声 · 檐下滴水",
    weather: "warm",
  },
  雾林旧道: {
    detail: "凉雾贴着衣袖往上爬。前方红绳忽然绷紧，另一侧的泥脚印却没有回程。",
    sound: "叶上水滴 · 林风 · 忽远忽近的铃",
    weather: "mist",
  },
  废弃山祠: {
    detail:
      "断碑下散着烧焦的符纸。守祠者掌心压住一道裂纹，每次阵光亮起，他的肩头就低一分。",
    sound: "低沉阵鸣 · 绳索绷紧 · 碎石落地",
    weather: "mist",
  },
  归途上的药篓: {
    detail: "药工的呼吸终于稳了。山下灯火近在眼前，篓里的成株还带着温湿的土。",
    sound: "晚风 · 草叶摩擦 · 山下犬吠",
    weather: "moon",
  },
  有人记得你: {
    detail: "药庐门槛被人擦干了。你还没开口，一碗热汤已经放在旧航图旁。",
    sound: "茶碗轻碰 · 炉火 · 松风",
    weather: "warm",
  },
  山下坊市: {
    detail:
      "灵草铺的蒸汽越过青石路。郁青用一枚铜钱压住图角，余光始终留意着上山的人。",
    sound: "茶摊人声 · 风铃 · 远处马蹄",
    weather: "warm",
  },
  青嶂关: {
    detail:
      "罡风掠过石阶，衣袖瞬间绷直。青嶂横杖挡住你的去路，杖后留下的却是一段背风处。",
    sound: "山风 · 碎石 · 木杖点地",
    weather: "mist",
  },
  山口行营: {
    detail: "篝火被石圈护着。帐外风紧，你把航图又往灯下挪了一寸。",
    sound: "营火 · 帐布 · 山口长风",
    weather: "moon",
  },
  云外长路: {
    detail:
      "最后一级石阶没入云端。再抬头时，瀑布已在脚下，漫长的山风第一次变得轻了。",
    sound: "高处清风 · 远瀑 · 衣袂轻响",
    weather: "moon",
  },
  云栈旅亭: {
    detail: "木栏外是无边云海。路簿摊在灯旁，未干的墨迹留着另一个旅人的体温。",
    sound: "风过栏杆 · 翻页 · 远瀑",
    weather: "moon",
  },
  不该到来的信: {
    detail:
      "封口的灵光刚刚熄灭，纸页却泛着陈年的黄。陆迟指尖停在那个熟悉的缺口上。",
    sound: "信纸轻响 · 窗外山风",
    weather: "moon",
  },
  灯下分路: {
    detail:
      "探路用的绳索铺在灯下。对面的人等着你抬头，谁也没有先收起另一只茶盏。",
    sound: "灯芯 · 茶水 · 帐外风",
    weather: "moon",
  },
  雾生旧药圃: {
    detail: "草叶上凝着冷露。石角蹲在断水的石渠旁，双手拢住最后一株引灯草。",
    sound: "露水 · 苔间细流 · 衣角扫草",
    weather: "mist",
  },
  无人的废驿: {
    detail: "檐下信袋干燥得反常。雨水绕着一圈旧阵纹流过，偏偏不肯越过门槛。",
    sound: "雨打瓦 · 门轴 · 细微阵鸣",
    weather: "rain",
  },
  雾海回声阵: {
    detail: "归绳在掌心一点点收紧。雾里有人叫你的名字，声音却从两个方向传来。",
    sound: "雾海风 · 归绳 · 重叠回声",
    weather: "mist",
  },
  灯还在等人: {
    detail: "门后只有一盏灯。陈旧的寄信阵缓慢呼吸，桌上的字迹终于能够辨认。",
    sound: "灯焰 · 阵息 · 空屋滴水",
    weather: "moon",
  },
  有人等你归来: {
    detail: "茶摊留着靠里的位置。探灵灯与旧记录摆在桌上，热茶的白汽漫过灯沿。",
    sound: "茶摊 · 风铃 · 杯沿轻响",
    weather: "warm",
  },
  再见那座山祠: {
    detail: "旧日的阵光已经散去。探灵灯照上断墙，你才发现刻痕一直延伸到墙后。",
    sound: "松风 · 灯焰 · 脚下碎瓦",
    weather: "moon",
  },
};
export type RouteChapter = "adventure" | "road" | "mist";
export function currentLandmark(s: State): {
  chapter: RouteChapter;
  key: string;
  title: string;
  image: string;
  goal: string;
} {
  const a = s.adventure;
  if (a.step !== "done")
    return {
      chapter: "adventure",
      key: a.step,
      title: adventureScenes[a.step].name,
      image: adventureScenes[a.step].image,
      goal: adventureGoal(a),
    };
  if (a.mist.stage !== "dormant")
    return {
      chapter: "mist",
      key: a.mist.stage,
      title: mistScenes[a.mist.stage].title,
      image: mistScenes[a.mist.stage].image,
      goal: mistGoal(s),
    };
  return {
    chapter: "road",
    key: a.road.stage,
    title: roadScenes[a.road.stage].name,
    image: roadScenes[a.road.stage].image,
    goal: roadGoal(s),
  };
}
export interface RouteNode {
  key: string;
  label?: string;
  active?: boolean;
  title: string;
  image: string;
  x: number;
  y: number;
  current: boolean;
  visited?: boolean;
  intent?: Intent;
  condition: string;
}
type ActiveRouteNode = Omit<RouteNode, "x" | "y" | "label" | "active">;
function activeRouteNodes(s: State): ActiveRouteNode[] {
  const current = currentLandmark(s);
  const keys =
    current.chapter === "adventure"
      ? ["ferry", "apothecary", "forest", "shrine", "home"]
      : current.chapter === "road"
        ? [
            "home",
            "market",
            "camp",
            s.adventure.road.passed ? "beyond" : "pass",
            "lookout",
          ]
        : ["camp", "garden", "station", "gate", "home"];
  return keys
    .map<ActiveRouteNode>((key) => {
      let title: string,
        image: string,
        intent: Intent | undefined,
        condition = "循当前线索推进，在当地完成故事后开启下一段路。";
      if (current.chapter === "adventure") {
        const scene = adventureScenes[key as keyof typeof adventureScenes];
        title = scene.name;
        image = scene.image;
        const step = s.adventure.step;
        const action =
          key === "apothecary" && step === "ferry"
            ? "depart"
            : key === "forest" && step === "apothecary"
              ? "depart"
              : key === "apothecary" && step === "shrine"
                ? "retreat"
                : undefined;
        if (
          action &&
          adventureOptions(s.adventure).some((o) => o.action === action)
        ) {
          intent = { type: "adventure", action };
          condition = "沿现有路线前往，不推进修行月份。";
        } else if (step === "ferry" && key === "apothecary")
          condition = "先检查药篓与布片，带着青痕去请温蘅辨认。";
        else if (step === "forest" && key === "shrine")
          condition = "林中有两条路；回到雾林辨认红绳与脚印，再决定如何前行。";
      } else if (current.chapter === "road") {
        const scene = roadScenes[key as keyof typeof roadScenes];
        title = scene.name;
        image = scene.image;
        const action = (
          {
            market: "market",
            camp: "camp",
            pass: "pass",
            beyond: "pass",
            lookout: "lookout",
          } as Record<string, RoadAction>
        )[key];
        if (action) {
          condition = roadError(s, action);
          if (!condition) {
            intent = { type: "road", action };
            condition = "沿现有山路前往，不推进修行月份。";
          }
        }
      } else {
        const scene = mistScenes[key as keyof typeof mistScenes];
        title = scene.title;
        image = scene.image;
        const action = key as MistAction;
        condition = mistError(s, action);
        if (!condition) {
          intent = { type: "mist", action };
          condition = "沿已知归路前往，不推进修行月份。";
        }
      }
      const isCurrent = key === current.key;
      if (
        s.status !== "alive" ||
        s.pending ||
        s.social.scene ||
        s.social.arena.duel ||
        s.expedition.duel
      ) {
        intent = undefined;
        condition = "先处理眼前的事情，再继续前行。";
      }
      return {
        key,
        title,
        image,
        current: isCurrent,
        visited:
          current.chapter === "mist"
            ? key === "garden"
              ? s.adventure.mist.garden
              : key === "station"
                ? s.adventure.mist.station
                : key === "gate"
                  ? s.adventure.mist.passed
                  : key === "home"
                    ? s.adventure.mist.settled
                    : false
            : current.chapter === "road"
              ? key === "home"
                ? s.adventure.road.thanked
                : key === "market"
                  ? s.adventure.road.map
                  : key === "beyond"
                    ? s.adventure.road.passed
                    : false
              : false,
        intent: isCurrent ? undefined : intent,
        condition: isCurrent ? current.goal : condition,
      };
    })
    .concat(
      keys.includes(current.key)
        ? []
        : [
            {
              key: current.key,
              title: current.title,
              image: current.image,
              current: true,
              condition: current.goal,
            },
          ],
    );
}

function physicalKey(chapter: RouteChapter, key: string) {
  if (chapter === "road")
    return key === "home" ? "apothecary" : key === "beyond" ? "pass" : key;
  if (chapter === "mist")
    return key === "camp"
      ? "mist-camp"
      : key === "letter"
        ? "lookout"
        : key === "home"
          ? "market"
          : key;
  return key;
}
export function routeNodes(s: State): RouteNode[] {
  const current = currentLandmark(s);
  const active = new Map(
    activeRouteNodes(s).map((n) => [physicalKey(current.chapter, n.key), n]),
  );
  const a = s.adventure,
    r = a.road,
    m = a.mist;
  const rescued = a.step === "done";
  // Only existing durable facts imply a visit. Merely seeing a place on the map does not.
  const visited: Record<string, boolean> = {
    ferry: a.step !== "ferry",
    apothecary: a.step !== "ferry",
    forest: rescued || a.step === "home" || a.step === "shrine",
    shrine: rescued || a.step === "home",
    home: rescued,
    market: r.met || m.settled,
    camp: r.stage === "camp",
    pass: r.obstacle !== "none" || r.passed,
    lookout: r.surveyed,
    "mist-camp": m.partner !== "none",
    garden: m.garden,
    station: m.station,
    gate: m.passed,
    archive: m.lamp,
  };
  return qingxuanLandmarks.map((place) => {
    const node = active.get(place.key);
    const image =
      place.chapter === "adventure"
        ? adventureScenes[place.scene].image
        : place.chapter === "road"
          ? roadScenes[place.scene].image
          : mistScenes[place.scene].image;
    return {
      key: place.key,
      title: node?.title ?? place.label,
      label: place.label,
      image: node?.image ?? image,
      x: place.x,
      y: place.y,
      current: node?.current ?? false,
      active: !!node,
      visited: !!visited[place.key] || !!node?.visited,
      intent: node?.intent,
      condition:
        node?.condition ??
        (visited[place.key]
          ? "这里留着你走过的足迹。当前没有直接前往的路线，可继续眼前的行程。"
          : "本界已知地标。当前通路尚未开启，沿眼前的行程逐步探索。"),
    };
  });
}

export function landmarkLabel(title: string): string {
  const labels: Record<string, string> = {
    有人记得你: "山门药庐",
    归途上的药篓: "听松归路",
    不该到来的信: "云栈信亭",
    旅亭来信: "云栈信亭",
    灯下分路: "雾海营地",
    灯还在等人: "旧驿灯室",
    有人等你归来: "山下坊市",
    再见那座山祠: "旧日山祠",
  };
  return labels[title] ?? title;
}
