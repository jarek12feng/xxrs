import {
  adventureOptions,
  adventureScenes,
  type Adventure,
  type AdventureAction,
} from "../adventure";
export interface SceneObject {
  id: string;
  name: string;
  x: number;
  y: number;
  detail: string;
  actions: AdventureAction[];
  art?: string;
  foot?: {x:number;y:number};
  kind: "person" | "object" | "exit";
  speaker?: string;
  portrait?: string;
}
// A read-only stage projection. Coordinates and observations never enter saves.
export function openingScene(a: Adventure) {
  const object = (
    id: string,
    name: string,
    x: number,
    y: number,
    detail: string,
    actions: AdventureAction[],
    art?: string,
  ): SceneObject => ({
    id,
    name,
    x: id === "medicine" ? 22 : x,
    y: id === "luchi" ? 55 : y,
    detail,
    actions,
    art,
    ...(id === "medicine" ? {foot:{x:22,y:72}} : id === "luchi" ? {foot:{x,y:72}} : {}),
    kind:
      id === "luchi" || id === "medicine"
        ? "person"
        : id === "exit"
          ? "exit"
          : "object",
    ...(id === "luchi"
      ? { speaker: "陆迟", portrait: "/art/characters/luchi.webp" }
      : {}),
    ...(id === "medicine"
      ? { speaker: "温蘅", portrait: "/characters/wenheng.png" }
      : {}),
  });
  const objects: SceneObject[] = [];
  let image: string = adventureScenes[a.step].image;
  let lead: string = adventureScenes[a.step].goal;
  switch (a.step) {
    case "invitation":
    case "ferry":
      image = "/art/initiation/herb-ferry-arrival.webp";
      objects.push(
        object("origin", "家中药囊", 43, 78, "药囊缝边还留着家乡晒药的草屑。你带着初学的引气法来到听松，尚未拜入宗门。", []),
        object(
          "basket",
          a.clue ? "药篓 · 已查明" : "漂回的药篓",
          25,
          67,
          "湿布上泛着青光，篓口的绳结朝内收紧。",
          ["inspect"],
        ),
        object(
          "luchi",
          "陆迟",
          60,
          57,
          "这铃……我父亲失踪前，也提过。",
          ["ask"],
          "/art/characters/luchi.webp",
        ),
        object(
          "exit",
          "上山石阶",
          85,
          38,
          a.clue
            ? "带着青瘴粉，去药庐问温蘅。"
            : "你认得药队的绳结，先看看漂回的药篓。",
          a.step === "invitation" ? ["enter"] : ["depart"],
        ),
      );
      lead = a.clue
        ? "青瘴粉留在篓中。沿石阶上山，去药庐问温蘅。"
        : "你来听松求学，却认出漂回的药篓系着药队求援的结。药篓上的痕迹或许能说明他们的去向。";
      break;
    case "apothecary":
      image = "/art/scene2d/apothecary-floor-v1.png";
      objects.push(
        object(
          "medicine",
          "温蘅 · 药炉",
          20,
          55,
          a.method === "medicine"
            ? a.ready
              ? "封好药包。遇到守卫，先让它闻到这股气息。"
              : "你来辨认这三味药，我替你看着火候。"
            : "不是毒血，是旧阵的灵尘。药气可以缓阵，我教你配药。",
          [
            "medicine",
            ...(a.method === "medicine"
              ? (["prepare", "rush"] as AdventureAction[])
              : []),
          ],
        ),
        object(
          "luchi",
          "陆迟 · 归绳",
          67,
          79,
          a.method === "guide"
            ? "扯两下就是退，别在雾里喊，声音传不远。"
            : "我跟你一起进山。先商量好，到阵门前谁稳阵、谁救人。",
          [
            "guide",
            ...(a.method === "guide"
              ? (["prepare", "rush"] as AdventureAction[])
              : []),
          ],
          "/art/characters/luchi.webp",
        ),
        object(
          "ward",
          "铜铃 · 调息",
          43,
          35,
          "铃声搅乱气息。试着稳住呼吸，而不是用灵力压过它。",
          [
            "ward",
            ...(a.method === "ward"
              ? (["prepare", "rush"] as AdventureAction[])
              : []),
          ],
        ),
        object(
          "exit",
          "雾林入口",
          87,
          52,
          a.ready
            ? "门外的雾里传来铃声。行装已妥，可以动身。"
            : "门外雾气渐浓。尚未备妥，也可先入林探路，遇险再退回来。",
          ["depart"],
        ),
      );
      lead = a.ready
        ? "行装已备妥。门外就是雾林。"
        : "温蘅指向药炉，陆迟放下归绳。选一种办法准备入山。";
      break;
    case "forest":
      objects.push(
        object(
          "rope",
          "枝上的红绳",
          28,
          43,
          "红绳系在离地半人高的枝上，绳尾指向深处。",
          ["trail"],
        ),
        object(
          "prints",
          "泥中的脚印",
          72,
          62,
          "脚印密集，却找不到清楚的回程；雾深处传来重复的铃声。",
          ["shortcut"],
        ),
      );
      lead = "两条路分入雾中。辨清痕迹，再决定往哪走。";
      break;
    case "shrine":
    case "home":
      image = "/scenes/shrine-relit.jpg";
      objects.push(
        object(
          "gate",
          a.step === "home" ? "阵门 · 已稳住" : "崩裂的阵门",
          51,
          38,
          a.step === "home"
            ? "急促的铃声已经停下，阵门不再下坠。"
            : "阵光沿裂口扑下。门外的守祠者用肩顶住石门，药工被困在门内。",
          a.step === "shrine" ? ["challenge"] : [],
        ),
        object(
          "herbs",
          "祠边药圃",
          77,
          66,
          a.step === "home"
            ? "幼株不动。成株可以带回救急，也可以留下养根。"
            : "幼株贴着石阶生长，守祠者始终护着它们。",
          a.step === "home" ? ["return", "takeHerbs"] : [],
          "/art/items/herbs.webp",
        ),
        object(
          "exit",
          a.step === "home" ? "归路上的陆迟" : "回药庐的路",
          20,
          66,
          a.step === "home"
            ? "药工已经脱险。等你决定好这些成株的去留，我们就下山。"
            : "红绳仍连着来路，准备不足时可以撤回。",
          a.step === "shrine" ? ["retreat"] : [],
          "/art/characters/luchi.webp",
        ),
      );
      lead =
        a.step === "home"
          ? "药工已脱险，阵门稳住了。临走前，决定药圃成株的去留。"
          : "药工就在门里。走近阵门，看看如何用上刚学的办法。";
      break;
    case "done":
      break;
  }
  if(a.step === "home") objects.push({id:"worker",name:"脱险的药工",x:34,y:80,detail:"药工已经离开阵门，在归路旁等候。",actions:[],kind:"person",speaker:"药工"});
  const legal = adventureOptions(a);
  return {
    key: a.step === "home" ? "shrine" : a.step,
    title: a.step === "home" ? "山祠药圃" : adventureScenes[a.step].name,
    image,
    lead,
    briefResult: a.result.match(/^.*?[。！？][”’]?/u)?.[0] ?? a.result,
    calm: a.step === "home" || (a.step !== "shrine" && a.ready),
    objects: objects.map((o) => ({
      ...o,
      ...(a.step === "home" && o.id === "exit"
        ? {
            kind: "person" as const,
            speaker: "陆迟",
            portrait: "/art/characters/luchi.webp",
          }
        : {}),
      options: legal
        .filter((x) => o.actions.includes(x.action))
        .map((option) => ({
          ...option,
          shortLabel: shortAction(a, option.action),
        })),
    })),
  };
}

// Display wording only: the original label remains available for the full action description.
function shortAction(a: Adventure, action: AdventureAction): string {
  if (action === "prepare") {
    if (a.ready) return "准备已妥";
    return {
      medicine: "文火温药",
      guide: "约定分工",
      ward: "随铃调息",
      none: "做好准备",
    }[a.method];
  }
  if (action === "rush")
    return {
      medicine: "猛火加药",
      guide: "各凭本事",
      ward: "强催灵气",
      none: "直接尝试",
    }[a.method];
  if (action === "depart")
    return a.step === "ferry" ? "前往药庐" : a.ready ? "进入雾林" : "入林探路";
  if (action === "challenge")
    return a.ready
      ? {
          medicine: "散药缓阵",
          guide: "合力救人",
          ward: "护体救人",
          none: "尝试闯入",
        }[a.method]
      : "尝试闯入";
  return {
    enter: "前往渡口",
    inspect: "检查药篓",
    ask: "问起铃声",
    medicine: "请教配药",
    guide: "邀陆迟同行",
    ward: "练习护体",
    trail: "循红绳走",
    shortcut: "走脚印近路",
    retreat: "撤回药庐",
    return: "留下成株",
    takeHerbs: "带回成株",
    finish: "展开修行",
  }[action];
}
