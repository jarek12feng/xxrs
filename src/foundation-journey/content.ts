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
    "井水倒悬在头顶，石壁上三道运功痕迹各自延伸。你试着引气，腕脉间的滞涩竟松动了一些。石偶却在此时转过身，封住通往内室的石阶。",
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
    "祝庭站在渡牌后，将一张空名籍推来：“得了井里的东西，就该留在渡上效力。”你没有接笔。执卫横枪封住石阶，身后已有渡客收起行囊，退回雨棚。",
  ),
  estate: battle(
    "药庄引水试炼",
    "失控护圃阵",
    120,
    21,
    80,
    ["discern", "guard", "strike"],
    "/art/characters/golem.webp",
    "水渠两头，一边是快枯死的新苗，一边是积水的老根。许芦喊出父亲教他的开渠次序，阙明棠却指向另一道闸。先稳住护圃阵，才能看清这片药圃究竟靠什么活着。",
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
    "雪从两道门间卷来，主门后的阵石已被压碎，西门绳槽却仍完整。季衡握住旧闸杆：“当年我只验了这一道。”你沿绳槽踏进风口，要亲手试出另一道门能不能接人。",
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
    "裂谷里落下一根绳，半途被乱流绷断。外缘还有人等着上岸。你将补给系紧，运起沉井所学，去找两股灵流交错的空隙。",
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
    "内侧的绳结连响三次，与你手中的绳头相应。只破外阵，回流就会灌进石室；只守住这里，里面的人便出不来。你得等到内侧换绳的那一息，拆开压住出口的支点。",
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
    "邱星罗认真展开完整阵步。台下旧识都在看这一场，他先向你拱手，才落下第一枚阵石。",
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
      "筑基之后，你已能走过从前止步的风口，可每逢运气到经脉深处，仍有一线滞涩。旧卷提到无名渡的沉井修行院：有人曾在那里学会借乱流行功。你把那页折好，放在行囊最上面。",
  },
  ferry: {
    name: "无名渡",
    image: "wuming-ferry",
    intro:
      "沉井旁的招牌写着“有缘者自取”。渡头却有人攥着还清药债的凭单，第三次被执卫赶回。祝庭替他扶起倒下的药筐，随手又将凭单压在名册下：“船小，下一班。”那人没再争，只望着已经空了半边的渡船。",
  },
  estate: {
    name: "晴川药庄",
    image: "herb-estate",
    intro:
      "你来求一批温养经脉的药材，却见药庄门前排满了人。阙明棠抱着祖父留下的匣子，迟迟不开库门。许芦把一张领药凭单放到门槛上：“我娘今早咳血。你先告诉我，这张纸今天还作不作数。”",
  },
  snow: {
    name: "雪线旧门",
    image: "snow-gates",
    intro:
      "你来旧门试一试筑基后的护体。碑上“全队撤回”四字被积雪填满，温蘅带来的旧诊页却比归队名册多了几行。季衡没有看她，伸手拂去碑上的雪：“先别刻新的。陪我走一遍西门。”",
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
      "云外古道的灵流从脚下升起，与你在沉井遇见的全然相反。你刚想试着运气，腕脉便被震得发麻。陶泊把船钩横在你面前：“在岸上站稳了，再谈过河。”远处有人撑着半幅阵旗，石台上留着供人调息的空位。",
  },
};
export const sideChoices: Record<
  Side,
  Record<string, { label: string; result: string }>
> = {
  estate: {
    heir: {
      label: "保留药庄，押下祖产偿还旧欠",
      result:
        "阙明棠将祖宅的契纸压在欠账上：“药圃不能卖。到期还不上，先动这个。”许芦逐笔核过，拿走首批工钱凭单；余款仍留着她的押印。阙氏的匾保住了，祖宅却再不能任她处置。",
    },
    shared: {
      label: "让育苗的药工分得收成",
      result:
        "许芦指着新约里的“赏”字，迟迟不肯签。阙明棠提笔划去，改成按育苗出力分成，账册由双方查验。等两人议定，运大宗药材的车已走了。她站在空门前，最后还是先将救急的小包递给许芦。",
    },
    split: {
      label: "卖去闲产还急欠，分开药圃与药库",
      result:
        "阙明棠把能变卖的家产列在纸上，唯独祖父的旧秤写了又划掉。许芦没有催她，先带人清点药库。急欠偿清后，药圃和药库各自交接；她把最后一张旧订单递给新药站，门外已有人来卸阙氏的匾。",
    },
  },
  snow: {
    public: {
      label: "把查明的经过刻在旧碑旁",
      result:
        "季衡要将名字刻在最前，温蘅拦下刻刀：“少报的人，是我。别替我认。”韩肃挪售阵石、另令封门，季衡未查西门，温蘅低报伤亡，逐项写明。山门见证人与药队各存一份。新碑落成时，有家属没有来，谁也没去催。",
    },
    protect: {
      label: "隐去证人住处，再公布查明的经过",
      result:
        "温蘅的手停在一行住址上：“她肯把这页给我，没答应让所有人找上门。”你们封存原页，在副本隐去住处。当日查明的经过仍交给山门见证人公布，缺漏另记待查。温蘅留下自己的名字，没有一并遮去。",
    },
    repair: {
      label: "先补齐救援器材，另留人查明责任",
      result:
        "季衡扛着新留引上山，山下药队逐户交付补偿凭单。一位家属接过药钱，却把请他来见季衡的口信推了回来。季衡听后只点了点头。旧令与诊页交给不同堂口的人继续核查，没有随这笔钱一同销去。",
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
