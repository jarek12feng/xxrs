import { actionProcess } from "./action-process";
import {
  adventureScenes,
  rescueChoices,
  roadScenes,
  passSolutions,
  passEcho,
  roadClues,
  mistScenes,
  companion,
  relationship,
  relationshipGoal,
  rivals,
  techniques,
  nextGoal,
  places,
  relics,
  type State,
  type Intent,
} from "./core";
import type { ActionReceipt } from "./action-feedback";
import { luchiView } from "./characters";

export function sceneLocation(
  s: State,
  chapter?: "adventure" | "road" | "mist",
) {
  if (chapter !== "road" && s.adventure.mist.stage !== "dormant")
    return s.adventure.mist.stage === "shrine" && s.adventure.mist.revisited
      ? "旧山祠 · 归灯长明"
      : mistScenes[s.adventure.mist.stage].title;
  return s.adventure.step === "done"
    ? roadScenes[s.adventure.road.stage].name
    : adventureScenes[s.adventure.step].name;
}
// Presentation-only replies: consequences and relationships still come from the rule state.
const replies: Record<string, Record<string, string>> = {
  meet: {
    help: "这几株正用得上。你认药这么准，下回进山还找你。",
    share: "原来岔路在老槐树后面，我记错了。借你的册子抄两笔。",
    listen: "说着说着茶都凉了。掌柜，再添些热水！",
  },
  walk: {
    care: "那边的标记补好了。伤者能走了吗？我来扶这一位。",
    mark: "这里也标上了？好，下雨时就怕人看不清这个岔口。",
    stay: "最后那位腿脚慢，我陪着。你帮忙把前头的灯挑高些。",
  },
  night: {
    promise: "好。我会闭好这次关。等你来时，那段旧路应该也修好了。",
    honest: "那便不定日子。路上若有信使，托他带一句平安给我。",
  },
  watch: {
    thanks: "说定了。下回你站前排，我一抬头就能看见。",
    learn: "你最后那步有点急。来，借这两只茶碗比一比站位。",
  },
  pledge: {
    yes: "嗯。收好，别跟灵石混放，磨坏了我可不替你重做。",
    later: "好，我留着。茶还热，要不要再坐一会儿？",
  },
};

export function enrichReceipt(
  before: State,
  after: State,
  intent: Intent,
  r: ActionReceipt,
): ActionReceipt {
  r.process = actionProcess(intent);
  if (
    intent.type === "adventure" &&
    intent.action === "challenge" &&
    before.adventure.ready
  ) {
    r.process =
      before.adventure.method === "medicine"
        ? {
            kind: "medicine",
            title: "药气缓阵",
            beats: [
              "你松开药包，让一缕药气先触到阵纹。",
              "妖修的肩头不再颤动，铃声慢了下来。",
              "你伸手扶住药工，沿渐暗的阵纹退回。",
            ],
          }
        : before.adventure.method === "guide"
          ? {
              kind: "investigate",
              title: "系绳共渡",
              beats: [
                "你扯了两下红绳，陆迟点头回应。",
                "他牵住阵门的灵流，你俯身扶起伤者。",
                "绳索重新绷紧，你们一起退出阵光。",
              ],
            }
          : {
              kind: "array",
              title: "护体入阵",
              beats: [
                "你循铃声稳住呼吸，将灵气护在肩背。",
                "断门的压力沉下来，你背起伤者。",
                "妖修撑住身后的阵光，你一步步走出山祠。",
              ],
            };
  }
  r.unlocks = after.journey.known
    .filter((k) => !before.journey.known.includes(k))
    .map((k) => `习得功法 · ${techniques[k].name}`);
  if (intent.type === "promote") {
    r.tone = "success";
    r.next = "新功法已收入功法面板，现在即可装配。" + nextGoal(after);
    r.unlocks.push(
      ...after.journey.known
        .filter((k) => !before.journey.known.includes(k))
        .map((k) => techniques[k].hint),
    );
  }
  if (intent.type === "equip")
    r.notes = [
      `已装配「${techniques[intent.technique].name}」。${techniques[intent.technique].slot === "main" ? "主修" : "辅修"}槽位已更新，原槽位功法仍保留在已学列表。`,
    ];
  if (intent.type === "equipRelic")
    r.notes = [
      `已装配${relics[intent.relic].name}，当前品阶 ${after.journey.relics[intent.relic]}。下一次挑战按这件灵器结算。`,
    ];
  if (
    intent.type === "explore" &&
    before.journey.maps[intent.place] !== after.journey.maps[intent.place]
  ) {
    const step = after.journey.maps[intent.place];
    r.title = step === 3 ? "此地探索完成" : "山河见闻 · 新的进展";
    r.scene = {
      from: places[intent.place].name,
      to: places[intent.place].name,
      body: r.notes.join(" "),
      chapter: "world",
      place: intent.place,
      unlocks: [`探索进度 ${step} / 3`, ...r.unlocks],
    };
    if (step === 3)
      r.scene.unlocks.push(
        intent.place === "valley"
          ? "雾岭线索已记录"
          : intent.place === "peak"
            ? "雾海航图已取得"
            : "孤灯来信已读完",
      );
  }
  if (
    intent.type === "adventure" ||
    intent.type === "road" ||
    intent.type === "mist"
  ) {
    const a = before.adventure,
      b = after.adventure,
      unlocks: string[] = [];
    const unlocked = (old: boolean, now: boolean, label: string) => {
      if (!old && now) unlocks.push(label);
    };
    if (
      a.rescueChoice !== b.rescueChoice &&
      (b.rescueChoice === "roots" || b.rescueChoice === "supplies")
    ) {
      unlocks.push(rescueChoices[b.rescueChoice].title + " · 本世选择已记下");
      r.person = {
        name: "陆迟",
        portrait: "/characters/luchi-base.png",
        response:
          b.rescueChoice === "roots"
            ? "护根的绳结收好。下回进山，说不定还用得上。山下缺的药，我再去问问。"
            : "伤者今晚用得上了。等春天，我陪药工回来补种。",
        relation: "陆迟记得归途上的药篓",
      };
    }
    unlocked(a.clue, b.clue, "发现青瘴粉与归路红绳");
    unlocked(a.ready, b.ready, "应对方法已备妥");
    if (a.ready && !b.ready) unlocks.push("准备已失效 · 回药庐重新准备");
    unlocked(
      a.step === "done",
      b.step === "done",
      "第一卷完成 · 航图之外已开启",
    );
    unlocked(a.road.map, b.road.map, "航图补全 · 青嶂关已开放");
    unlocked(a.road.ally, b.road.ally, "郁青已答应同行");
    unlocked(a.road.passed, b.road.passed, "青嶂关归路已通");
    if (
      a.road.solution !== b.road.solution &&
      b.road.solution !== "none" &&
      b.road.solution !== "legacy"
    ) {
      unlocks.push(passSolutions[b.road.solution].name + " · 本世选择已留下");
      const echo = passEcho(after)!;
      r.person = {
        name: echo.name,
        portrait: echo.image!,
        response: echo.quote,
        relation: "青嶂记住了你留下的归路",
      };
    }
    unlocked(
      a.road.surveyed,
      b.road.surveyed,
      "安全归路已记下 · 雾海来信可接取",
    );
    for (const clue of b.road.discoveries.filter(
      (k) => !a.road.discoveries.includes(k),
    ))
      unlocks.push(`记入手记 · ${roadClues[clue].name}`);
    unlocked(a.mist.garden, b.mist.garden, "获得引灯叶 · 药圃证言已记录");
    unlocked(a.mist.station, b.mist.station, "掌握归阵节拍 · 废驿证据已记录");
    unlocked(a.mist.lamp, b.mist.lamp, "获得探灵灯 · 可照见旧山祠隐藏灵痕");
    unlocked(a.mist.settled, b.mist.settled, "归来的故事已与故人分享");
    unlocked(a.mist.revisited, b.mist.revisited, "归灯已点亮 · 雾海来信完成");
    if (a.mist.partner !== b.mist.partner)
      unlocks.push(
        b.mist.partner === "solo"
          ? "独行约定已记下"
          : `同行约定 · ${b.mist.partner === "luchi" ? "陆迟" : companion(after)?.name}`,
      );
    const from = sceneLocation(before, intent.type),
      to = sceneLocation(after, intent.type);
    const body =
      intent.type === "adventure"
        ? b.result
        : intent.type === "road"
          ? b.road.result
          : b.mist.result;
    r.scene = { from, to, body, unlocks, chapter: intent.type };
    if (!r.ritual)
      r.title = unlocks.length
        ? a.ready && !b.ready
          ? "准备失效 · 先别硬闯"
          : "线索与进展"
        : from !== to
          ? `抵达 · ${to}`
          : "此刻的回应";
    if (
      a.road.solution !== b.road.solution &&
      b.road.solution !== "none" &&
      b.road.solution !== "legacy"
    )
      r.title = passSolutions[b.road.solution].name + " · 归路已成";
    if (a.ready && !b.ready) r.tone = "warning";
    if (intent.type === "mist" && ["steady", "pursue"].includes(intent.action))
      r.scene.unlocks.push("已选择入阵方案 · 真正入阵时才扣补给");
  }
  if (intent.type === "choose" && before.pending && after.status !== "dead") {
    const kind = before.pending.kind;
    const response =
      kind === "meeting"
        ? "这封信，拜托你了。第三十六个月，我在渡口等你。"
        : kind === "letter"
          ? intent.option === "leave"
            ? "好，不提了。渡口的风大，坐里边些。"
            : "娘每年都留着父亲那副碗筷。我总得去找一找。"
          : kind === "visit"
            ? "药带来了，搁你桌上。我多买了一份，别跟我推来推去。"
            : kind === "departure"
              ? intent.option === "stay"
                ? "那就各自保重。这一趟，我自己走。"
                : "走吧。遇到危险，我们先商量，不把谁留在后面。"
              : kind === "crossing"
                ? "多亏你没有把我留在阵外。前面的路，我们继续一起看。"
                : intent.option === "gift"
                  ? "这枚丹药的分量，我记住了。等你叩关，我会在一旁护法。"
                  : "丹药收好，别受潮。你闭关那日，给我留个信。";
    r.person = {
      name: "陆迟",
      portrait: luchiView(after).portrait,
      response,
      relation: `道友信任 ${before.story.trust} → ${after.story.trust}`,
    };
    r.title = "陆迟记住了你的选择";
    if (
      before.story.luchi !== "foundation" &&
      after.story.luchi === "foundation"
    )
      r.unlocks.push("陆迟已筑基 · 突破护法已生效");
  }
  if (intent.type === "choose" && before.social.scene) {
    r.returnTo = "relationship";
    const who = companion(after)!;
    r.person = {
      name: who.name,
      portrait: who.portrait,
      response:
        replies[before.social.scene.kind]?.[intent.option] ||
        "这段同行的经历，我会记得。",
      relation:
        relationship(before) === relationship(after)
          ? relationship(after)
          : `${relationship(before)} → ${relationship(after)}`,
    };
    r.title =
      after.social.bonded && !before.social.bonded
        ? "两心相许 · 心意有了回应"
        : "话音落下，对方回应了你";
    r.next = relationshipGoal(after);
    r.unlocks.push(
      ...after.social.memories
        .filter((k) => !before.social.memories.includes(k))
        .map(
          (k) =>
            `共同记忆 · ${{ walk: "共勘旧路", night: "灯下谈心", watch: "赛后相叙" }[k]}`,
        ),
    );
    if (after.social.bonded && !before.social.bonded)
      r.unlocks.push(`珍藏信物 · ${who.keepsake}（已定情，尚未举办婚礼）`);
  }
  if (
    (intent.type === "arenaTurn" || intent.type === "arenaWithdraw") &&
    before.social.arena.duel &&
    !after.social.arena.duel
  ) {
    const win = after.social.arena.wins > before.social.arena.wins;
    r.ritual = "duel";
    r.tone = win ? "success" : "warning";
    r.title = win
      ? `擂台获胜 · ${rivals[before.social.arena.duel.opponent].name}`
      : intent.type === "arenaWithdraw"
        ? "主动认负 · 留待再战"
        : "本场落败 · 整备再战";
    r.next =
      after.social.arena.invited && !before.social.arena.invited
        ? `${companion(after)?.name}在台下等你。前往人物缘分，赴赛后邀约。`
        : win
          ? after.social.arena.wins >= Object.keys(rivals).length
            ? "已成为听松试剑魁首。装配所得功法，把这番成长带到山外的探索中。"
            : "功法与奖励已入囊。可以先装配新功法，再观摩下一位对手。"
          : "先养伤，再根据对手意图选择应对；凝神、固本和装备也会改变胜算。";
  }
  return r;
}
