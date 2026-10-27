import type { State } from "./world";
import type { PassSolution } from "./road";

export const passSolutions = {
  medicine: {
    name: "医道 · 草木作桥",
    prepare: "diagnoseRoots",
    finish: "healPass",
    observe: "辨认枯萎的镇风草",
    commit: "救活镇风草，留下药站",
    requirement: "医道或学过辨草录；心得 2。完成消耗灵草 6、灵石 4。",
    consequence:
      "保住旧阵和刻痕，青嶂愿在山口照料伤者。药队只能沿窄径步行，货车仍须绕行。日后可凭这次救草经验处理雾海药圃。",
    finding:
      "镇风草并未死去，只是根脉被淤泥堵住。温养草根便能借旧阵稳风；药队可以步行通过，却不能把这条活根小径拓成车道。",
  },
  sword: {
    name: "剑道 · 一剑开山",
    prepare: "markCut",
    finish: "cutPass",
    observe: "标出断崖与旧刻痕的位置",
    commit: "斩开风口，留下商道",
    requirement: "剑意 4，或装配听松灵剑；根基 12。完成消耗灵石 8。",
    consequence:
      "宽路可通货车，郁青将组织商队运药；旧阵和部分刻痕无法复原。青嶂仍守路，却不再邀你喝茶。第三卷可请商队协助架起归桥。",
    finding:
      "断崖与风脉相连。青嶂指着刀口上的旧名字：“你能劈开它，车也能过去。但这块石头上的人，再没有第二份名字。”郁青说货车能多送药；最后由你决定。",
  },
  array: {
    name: "识阵 · 与山立约",
    prepare: "traceArray",
    finish: "restorePass",
    observe: "对照石阶刻痕与药队时刻",
    commit: "修复旧阵，约定通行时刻",
    requirement: "调查药队账册与石阶刻痕；神识 8、心得 2。完成消耗灵石 6。",
    consequence:
      "保住旧刻痕与阵法，青嶂和药队共同按时开关；商队需等候窗口，不能随到随走。记下归阵手法，日后可独自辨读雾海废驿。",
    finding:
      "刻痕是旧阵的换气标记，账册记录的歇脚时刻正好补齐缺失的节拍。你可以修回它，但必须留下按时开关的约定，不能让后来者误以为随时都能走。",
  },
} as const;
export type PassAction = (typeof passSolutions)[PassSolution][
  "prepare" | "finish"];
const solutionFor = (action: string) =>
  (Object.keys(passSolutions) as PassSolution[]).find(
    (k) =>
      passSolutions[k].prepare === action || passSolutions[k].finish === action,
  );
export function isPassAction(action: string): action is PassAction {
  return solutionFor(action) !== undefined;
}
// Called only after the shared road scene, event and life-status guards.
export function passActionError(s: State, action: PassAction): string {
  const r = s.adventure.road,
    key = solutionFor(action)!,
    plan = passSolutions[key];
  if (r.passed) return "这条归路已经留下，不能重写本世的选择";
  if (r.obstacle === "none") return "先观察山风，听青嶂说清危险";
  if (action === plan.prepare) {
    if (r.prepared === key) return "已看清这一解法，可准备后作出决定";
    if (
      key === "array" &&
      !(r.discoveries.includes("ledger") && r.discoveries.includes("marks"))
    )
      return (
        "先调查" +
        [
          !r.discoveries.includes("ledger") ? "坊市药队账册" : "",
          !r.discoveries.includes("marks") ? "山口石阶刻痕" : "",
        ]
          .filter(Boolean)
          .join("和")
      );
    return "";
  }
  if (r.prepared !== key) return "先观察这条解法；此时还不会扣费或改变归路";
  if (s.realm !== 1) return "需先筑基，才能承受山口灵流";
  if (s.injury >= 3) return "伤势过重，先养伤至 2 以下";
  if (key === "medicine") {
    if (s.path !== "wood" && !s.journey.known.includes("herb"))
      return "需要医道，或在坊市学会辨草录";
    if (s.study < 2) return "需要心得 2，先研读药理";
    if (s.herbs < 6) return "需要灵草 6 温养镇风草";
  }
  if (key === "sword") {
    if (s.mastery < 4 && s.journey.equipped !== "sword")
      return "需要剑意 4，或炼制并装配听松灵剑";
    if (s.foundation < 12) return "需要根基 12 稳住断崖";
  }
  if (key === "array") {
    if (!(r.discoveries.includes("ledger") && r.discoveries.includes("marks")))
      return (
        "需要" +
        [
          !r.discoveries.includes("ledger") ? "坊市药队账册" : "",
          !r.discoveries.includes("marks") ? "山口石阶刻痕" : "",
        ]
          .filter(Boolean)
          .join("和")
      );
    if (s.sense < 8 || s.study < 2) return "需要神识 8、心得 2 辨清阵纹";
  }
  const cost = { medicine: 4, sword: 8, array: 6 }[key];
  return s.stones < cost ? `需要灵石 ${cost}` : "";
}
// Mutates only the private clone owned by runRoad. No time or RNG is consumed.
export function applyPassAction(s: State, action: PassAction) {
  const r = s.adventure.road,
    key = solutionFor(action)!,
    plan = passSolutions[key];
  if (action === plan.prepare) {
    r.prepared = key;
    r.result = plan.finding + " 尚未实施，可改看其他办法。";
    return;
  }
  s.stones -= { medicine: 4, sword: 8, array: 6 }[key];
  if (key === "medicine") s.herbs -= 6;
  r.solution = key;
  r.passed = true;
  r.stage = "beyond";
  r.result =
    {
      medicine:
        "你将六株灵草的药气渡入根脉，镇风草重新攀住石阶。青嶂俯身扶起第一位过关的药工，答应把空亭改作药站。窄径留住了草木与旧刻痕，货车仍需绕行。",
      sword:
        "你一剑截开风脉，碎石与旧刻痕一同落入云海。第一辆药车驶过新路，郁青向你挥手；青嶂默默收起茶碗，转身为商队检查崖边。他仍守这条路，却不再请你坐下。",
      array:
        "你把错位的灵脉重新接回，青嶂敲杖三声，风壁在约定的节拍里打开。郁青在图上写下等候时刻。旧名字留在原处，但想赶路的人必须等一等。你记下了归阵手法。",
    }[key] + " 这条归路的变化已记入本世，不能更换解法。";
}
export function passEcho(
  s: State,
): { body: string; quote: string; name: string; image: string | null } | null {
  const r = s.adventure.road;
  if (!r.passed || r.solution === "none" || r.solution === "legacy")
    return null;
  const market = r.stage === "market",
    pavilion = r.stage === "lookout";
  const body = {
    medicine: market
      ? "药摊新添了送往青嶂关的药箱。药工说，青嶂已经把空亭改成药站；货车仍绕山走，挑担的人却有了歇脚处。"
      : pavilion
        ? "路簿旁多了一张药站位置图。背药篓的旅人先问哪段草根不能踩，才沿窄径下山。"
        : "活过来的镇风草连成一条窄径。青嶂在旧亭里替药工换药，石阶上的旧名字仍清晰可见。远处货车沿山下长路绕行。",
    sword: market
      ? "地图摊旁停着第一辆满载药材的货车。郁青组织起直达青嶂关的商队，另用一页纸记下无法复原的刻痕。"
      : pavilion
        ? "旅亭多了卸货的车辙。路簿上画着新开的宽路，另一页却只留着几行无法辨全的旧名字。"
        : "货车驶过斩开的风口。旧阵已经沉入云海，青嶂为后来人补好护栏，见你回来只点了点头，没有摆出茶碗。",
    array: market
      ? "郁青在航图旁挂出通行时刻。药队按时集合，也有赶路人不耐烦地等候；旧阵的约定已经成了山下人的日常。"
      : pavilion
        ? "亭里的旅人核对下次开关的时刻。有人借等候喝完一碗茶，有人焦急踱步，石阶上的旧名字依然完整。"
        : "青嶂敲杖三声，药队随阵门开合依次过关。你留下的时刻刻在新石牌上，与旧名字并排；错过的人在亭中等候。",
  }[r.solution];
  const quote = {
    medicine: market
      ? "你留下的药站开始接人了。车走得慢些，挑担的人却少受些伤。"
      : "草根长回来了。我会照看药站，也会提醒人别踩坏这条路。坐下喝碗茶吧。",
    sword: market
      ? "这一车能多送不少药。可山上的名字，我只能记下还认得的那些。"
      : "路我会继续守。你开路救人的心意我明白，但那几个人的名字，回不来了。",
    array: market
      ? "我把时刻写进每张图里。生意急，也不能把约定省掉。"
      : "你修的是阵，也是约定。等这队人过去，来把那壶茶喝完。",
  }[r.solution];
  return {
    body,
    quote: pavilion
      ? {
          medicine: "药站在关前旧亭，挑担者请循草根外侧行走，勿碾压活根。",
          sword: "货车可走新道。旧刻痕已失，请见过原石的人来补录名字。",
          array: "听三声木杖再过关，未到时刻请在亭中等候。",
        }[r.solution]
      : quote,
    name: market ? "郁青" : pavilion ? "行路手记" : "青嶂",
    image: pavilion
      ? null
      : market
        ? "/characters/yuqing.jpg"
        : "/characters/qingzhang.jpg",
  };
}
