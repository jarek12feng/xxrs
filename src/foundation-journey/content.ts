import type { BattleId, Destination, Side } from "./state";
import type { Move } from "../expedition/content";
export interface Challenge {
  name: string;
  foe: string;
  hp: number;
  attack: number;
  cultivation: number;
  cost: number;
  prize: number;
  pattern: Move[];
  array: boolean;
  image: string;
  purpose: string;
}
const battle = (
  name: string,
  foe: string,
  hp: number,
  attack: number,
  cultivation: number,
  pattern: Move[],
  image: string,
  purpose: string,
  array = false,
): Challenge => ({
  name,
  foe,
  hp,
  attack,
  cultivation,
  cost: 4,
  prize: 10,
  pattern,
  array,
  image,
  purpose,
});
export const challenges: Record<BattleId, Challenge> = {
  well: battle(
    "沉井探府",
    "失控守府石偶",
    110,
    20,
    0,
    ["discern", "guard", "strike"],
    "/art/characters/golem.webp",
    "外府用于修习乱流中的运功。击败守卫后选择一条传承，并立即在出渡冲突中试用。",
    true,
  ),
  exit: battle(
    "破开离渡禁制",
    "祝庭的渡口执卫",
    135,
    23,
    80,
    ["guard", "strike", "discern"],
    "/art/foundation-journey/ferry-guard.webp",
    "只打通自由出入的通路，不因胜利自动定罪；取证与寻姐仍可选择。",
  ),
  estate: battle(
    "药庄引水试炼",
    "失控护圃阵",
    120,
    21,
    80,
    ["discern", "guard", "strike"],
    "/art/characters/golem.webp",
    "重新疏通旧药圃，不把劳动与技艺据为一家私产。",
    true,
  ),
  snow: battle(
    "雪线留引试炼",
    "残损护山阵",
    155,
    24,
    180,
    ["guard", "discern", "strike", "guard"],
    "/art/characters/golem.webp",
    "亲自验证主门需要关闭、西门本可留下接应；旧案不会封锁原有教学。",
    true,
  ),
  frontier: battle(
    "古道外缘挑战",
    "裂谷守阵石偶",
    165,
    25,
    240,
    ["discern", "guard", "strike"],
    "/art/characters/golem.webp",
    "为自己的凝丹准备取得稳脉法，并将补给送到受困者手中。",
    true,
  ),
  rescue: battle(
    "内外应声",
    "崩裂的核心禁制",
    205,
    28,
    420,
    ["guard", "discern", "strike", "guard"],
    "/art/characters/golem.webp",
    "外侧断开乱流，内部同行者牵引归绳；两侧接应后可以一起撤出。",
    true,
  ),
  rank1: battle(
    "筑基试剑 · 初登榜",
    "罗砺 · 护舟刀",
    105,
    20,
    0,
    ["guard", "strike", "discern"],
    "/art/foundation-journey/rank-luoli.webp",
    "刀势重，收刀后露出空当。首胜进入筑基榜前三十。",
  ),
  rank2: battle(
    "筑基试剑 · 前十五",
    "周雁回 · 回风剑",
    135,
    23,
    100,
    ["strike", "guard", "strike", "discern"],
    "/art/foundation-journey/rank-zhouyanhui.webp",
    "追剑会吃反击，分辨她收势与回身的节拍。",
  ),
  rank3: battle(
    "筑基试剑 · 前八",
    "孟照野 · 照石阵",
    160,
    25,
    220,
    ["discern", "guard", "strike"],
    "/art/foundation-journey/rank-mengzhaoye.webp",
    "以阵步封路，稳守与辨影能为下一合创造机会。",
    true,
  ),
  rank4: battle(
    "筑基试剑 · 前三",
    "江问荷 · 长息诀",
    185,
    27,
    360,
    ["guard", "discern", "guard", "strike"],
    "/art/foundation-journey/rank-jiangwenhe.webp",
    "长息守势要求连续应对；准备灵草，或以剑经抢攻。",
  ),
  rank5: battle(
    "筑基试剑 · 争魁",
    "邱星罗 · 重整阵步",
    220,
    29,
    500,
    ["discern", "guard", "strike", "discern"],
    "/art/characters/qiuxingluo.webp",
    "邱星罗认真展开完整阵步。魁首只代表听松本届筑基组，不是全界最强。",
    true,
  ),
};
export const rankIds: BattleId[] = [
  "rank1",
  "rank2",
  "rank3",
  "rank4",
  "rank5",
];
export const destinations: Record<
  Destination,
  { name: string; image: string; intro: string }
> = {
  home: {
    name: "听松行前居",
    image: "journey-fork",
    intro:
      "青玄界还有更长的路。吐纳、历练与劳作积累筑基修行；探府取得传承，经历旧友与新人的去留，再为凝丹准备。所有可选支线与恋爱都可以暂缓。",
  },
  ferry: {
    name: "无名渡",
    image: "wuming-ferry",
    intro:
      "你为沉井修行院的传承而来。补船声与药布气味混在一起，离渡的人却被要求反复核验名籍。郁青的讣帖只证明来信可疑，不证明姐姐已死或仍活着。",
  },
  estate: {
    name: "晴川药庄",
    image: "herb-estate",
    intro:
      "阙明棠想保住药庄与工人的饭碗，许芦只问今天谁签领药凭单。你为修行药材而来，可先疏通旧药圃，再决定是否帮助把旧欠与经营分开交接。",
  },
  snow: {
    name: "雪线旧门",
    image: "snow-gates",
    intro:
      "季衡与温蘅撤下了全队撤回的旧碑文。你来检验护送本领，也可以追问主门关闭后，西门的留引为何没能救到人。阵痕能证明动作，不能替人开脱。",
  },
  inn: {
    name: "听雨旅亭",
    image: "roadside-pavilion",
    intro:
      "守驿的老人说阿团总叼灯出门。它是一只獾。你可以跟着泥脚印看看，也可以就此喝完茶离开；这里没有等着你揭开的巨大阴谋。",
  },
  frontier: {
    name: "云外古道",
    image: "frontier-valley",
    intro:
      "船工陶泊只愿趁水势平稳送人，同辈闻岑想把自己的小队带回来。程砚修士守住外部落脚点，教你稳脉，不替你做所有选择。这里的机缘也属于独行者。",
  },
};
export const sideChoices: Record<
  Side,
  Record<string, { label: string; result: string }>
> = {
  estate: {
    heir: {
      label: "有条件继承：承认旧欠，分期清偿",
      result:
        "阙明棠交出可查账权限，以非生产祖产作偿付保障。许芦拿到首批工钱凭单；你取回药材，不成为药庄账房。",
    },
    shared: {
      label: "共同契约：育苗者分享收益",
      result:
        "阙氏保留字号，药工取得育苗收益与复核权。重新分工延误了本次大宗供货，许芦把小额救急单先交出去。",
    },
    split: {
      label: "有序拆分：先清急欠，再交接药圃",
      result:
        "非必要家产先变卖还急欠，药圃与药库分别交接。部分工人改去新药站，阙明棠完成一轮订单转接，旧字号不再独占药路。",
    },
  },
  snow: {
    public: {
      label: "公开复核：各自承担责任",
      result:
        "山门轮值见证人与药队保管副本，韩肃挪料阻援、季衡未核验、温蘅低报伤亡分别记明。原碑重刻，家属可拒绝出席。",
    },
    protect: {
      label: "先保全证人：脱敏移交后公布",
      result:
        "温蘅交出原诊页，先隐去证人住处。轮值见证人在同次交接中公布已复核事实，保存补查入口，不以保密无限拖延。",
    },
    repair: {
      label: "先接续补偿：保留独立复核",
      result:
        "季衡先把留引器材送回旧门，药队交出补偿凭单。责任记录由不同堂口轮值复核，收钱不等于必须原谅。",
    },
  },
  inn: {
    leave: {
      label: "把旧灯留在亭内，驿门另挂路标",
      result:
        "老人跟你走到小亭，看见檐下的山雀与阿团。你们挂好驿门路标，她煮面时只问添不添葱。",
    },
    roof: {
      label: "补好漏雨屋檐，留作公共歇脚处",
      result:
        "你和老人把干草垫好，补住漏雨处。小亭成了路人的歇脚处；阿团仍偶尔叼灯过去，并不总听人话。",
    },
  },
};
