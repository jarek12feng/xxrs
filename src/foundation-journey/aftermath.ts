import type { State } from "../world";
import type { Side } from "./state";
export const aftermathScenes: Record<
  Side,
  Record<string, { label: string; scene: string; result: string }>
> = {
  estate: {
    heir: {
      label: "陪许芦验收第一批药材 · 领取灵石 8",
      scene:
        "药庄门口多了块小木牌。许芦正逐筐验药，阙明棠没有坐在上首，挽着袖子等他报数。“你说的先付急欠，我照做了。这批药，你肯再替我看一眼么？”",
      result:
        "你拣出两株混入的旧根，阙明棠当场换了新药。许芦拿着工钱先往家里走；阙明棠结清你的验药报酬，灵石 +8。",
    },
    shared: {
      label: "与药工试种分圃 · 收取灵草 4",
      scene:
        "旧药圃分出几块试种地，木签写着育苗者的名字。许芦的苗长得最快，却抢了旁边的水。阙明棠蹲在渠边，等两人把分水时辰说定，才请你帮忙移苗。",
      result:
        "你帮两人移开挤在一起的苗根。傍晚收水时，他们各自摘下新叶，请你收下这一季试种的谢礼，灵草 +4。",
    },
    split: {
      label: "送最后一箱药到新药站 · 领取回春散 1",
      scene:
        "旧字号的匾已卸下。阙明棠把最后一箱药推到门前，许芦在新药站等着。“路我走过，箱子却比从前沉。”她笑了一下，问你愿不愿同行这一程。",
      result:
        "你把药箱送到新站。许芦已挂起自己的小灯，阙明棠没有替他排明日的活。临走，他塞来一瓶新配的回春散，回春散 +1。",
    },
  },
  snow: {
    public: {
      label: "与季衡重走见证路线 · 习得辨痕应援",
      scene:
        "新碑前只有两束野花。季衡带着几名新弟子来，每过一处旧阵痕便停下，让他们先说自己的判断，再讲那年自己错在何处。轮到西门时，他把引路灯交给你。",
      result:
        "你带弟子辨清西门两次落闸留下的痕迹。季衡将这段辨痕法抄给你：古道接应前两合使用辨影时，伤害额外 +3。",
    },
    protect: {
      label: "陪温蘅走一段接应路 · 留下备用引绳",
      scene:
        "温蘅在山下等来一辆无名药车。车内的人没有下车，只从帘后伸出手，把旧日引绳交给她。温蘅收好，问你能否陪她走到西门；今日不谈姓名。",
      result:
        "你与温蘅将备用引绳藏在避风石后，试过两端都能受力。古道接应时沿用这套系法，首合承伤 −3。",
    },
    repair: {
      label: "和弟子试架新留引 · 练成稳守破障",
      scene:
        "西门终于挂上新留引。一个弟子试着放绳，手抖得厉害；季衡没有接过去，只把自己的手放在下方。你站到风口，为他们试第一阵风雪。",
      result:
        "你稳住绳头，再借回弹击开冻住的门轴。新弟子照着做了一遍。古道接应中，守势后的反击额外伤害 +3。",
    },
  },
  inn: {
    leave: {
      label: "添一碗面，听老人讲近况 · 伤势 −1",
      scene:
        "驿门的新路标被雨洗得发亮，旧灯还在亭内。阿团伏在灯下，抬眼看你，并没有起身。老人已往锅里添了一把面。",
      result:
        "你吃完面，把碗洗净放回窗边。老人说阿团近来很少淋雨了。歇脚后伤势 −1。",
    },
    roof: {
      label: "给新来的旅人指路 · 伤势 −1",
      scene:
        "修好的屋檐下多了两双湿鞋，两个赶路人正借火烤衣。老人把最后一块干地方留给你，阿团却先钻了进去。",
      result:
        "你把来路的浅滩画给旅人看。他们分你一碗热汤，说下次带些干柴。歇脚后伤势 −1。",
    },
  },
};
export function aftermathScene(s: State, side: Side) {
  return aftermathScenes[side][s.foundationJourney.sides[side].outcome];
}
export function revisit(s: State, side: Side) {
  const q = s.foundationJourney;
  q.aftermath[side] = true;
  q.last = aftermathScene(s, side)!.result;
  if (side === "estate") {
    if (q.sides.estate.outcome === "heir") s.stones += 8;
    if (q.sides.estate.outcome === "shared") s.herbs += 4;
    if (q.sides.estate.outcome === "split") s.growth.medicines.healing++;
  }
  if (side === "inn") s.injury = Math.max(0, s.injury - 1);
}
export function chapterEnding(s: State) {
  const q = s.foundationJourney;
  return [
    "长风归山 · 筑基篇终",
    "你独自走完归流阵，将沉井的传承与古道的稳脉法接成一个周天。最后一道灵流从指间散去时，程砚收起一直未用的护阵旗：“这条路，往后你能自己走了。”",
    q.inheritance === "spring"
      ? "你以长春续脉接住回流，掌心枯叶重新舒开。"
      : q.inheritance === "blade"
        ? "剑上余光收而不散，锋芒终于随你的呼吸停下。"
        : "纷乱阵纹在你眼中各归其位，吐息之间再无滞涩。",
    q.target === "companion"
      ? s.social.gender === "male"
        ? "沈听澜把新图摊在你膝前，指着尚未画完的一角。今夜先不赶路，你替她压住被风掀起的纸。"
        : "尹照川把备用阵盘留在门外，进屋时两手空空。他问你茶放在哪里，这回没有急着回去值夜。"
      : "闻岑托人送来一根磨得发亮的绳扣。他已带小队换了条稳妥些的路，信末画着一只歪歪扭扭的小船。",
    q.board.wins.length === 5
      ? "山门榜前有人认出本届魁首，侧身为你让路。"
      : "听松山门仍有新弟子在练剑，你从他们身旁走过，想起自己初来时的脚步。",
    "你把行囊放回窗下。修为、所学与一路结下的缘分都还在，明日仍是你自己的修行。",
  ];
}
