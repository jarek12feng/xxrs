import {
  adventureScenes,
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
    help: "你连路边的药草都记得这样清楚。下次改图，也来帮我看看，好吗？",
    share: "这段药径，我正缺一个走过的人来核对。你的心得，我会认真记下。",
    listen: "谢谢你愿意听完。这条路很长，有人坐下来听，就不算白走。",
  },
  walk: {
    care: "有你照料他们，我才能安心把归路画完。这一路，多亏我们分着做。",
    mark: "这几个标记能让后来的人少冒一次险。下次勘路，还一起走吧。",
    stay: "你没有催大家赶路。有人愿意等，回去的路也就没那么难走。",
  },
  night: {
    promise: "那就各自认真修行，也把想去的地方告诉彼此。方向，我们一起商量。",
    honest: "原来你也会怕。那就不必在彼此面前逞强，准备好了再往前走。",
  },
  watch: {
    thanks: "好。下次换你来看看我的修行，不只是我在台下等你。",
    learn: "那我们慢慢复盘。你愿意把失误说出来，我也会认真告诉你看见了什么。",
  },
  pledge: {
    yes: "这份心意，我收下了。归途小物不是束缚，是想让你知道，远行之后有人等你。",
    later: "不必现在给答案。我们先把眼前的路走好，你的心意由你自己决定。",
  },
};

export function enrichReceipt(
  before: State,
  after: State,
  intent: Intent,
  r: ActionReceipt,
): ActionReceipt {
  r.unlocks = after.journey.known
    .filter((k) => !before.journey.known.includes(k))
    .map((k) => `习得功法 · ${techniques[k].name}`);
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
    if (a.road.solution !== b.road.solution && b.road.solution !== "none" && b.road.solution !== "legacy") {
      unlocks.push(passSolutions[b.road.solution].name + " · 本世选择已留下");
      const echo = passEcho(after)!;
      r.person = { name: echo.name, portrait: echo.image!, response: echo.quote, relation: "青嶂记住了你留下的归路" };
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
    if (a.road.solution !== b.road.solution && b.road.solution !== "none" && b.road.solution !== "legacy")
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
            ? "好，先不说这些。愿意陪我坐一会儿，我已经记在心里了。"
            : "我想入山找父亲，也想让母亲不必再等。谢谢你听懂了。"
          : kind === "visit"
            ? "上回你替我奔走，这回也让我帮你一点。往后的路，别总一个人扛。"
            : kind === "departure"
              ? intent.option === "stay"
                ? "那就各自保重。这一趟，我自己走。"
                : "走吧。遇到危险，我们先商量，不把谁留在后面。"
              : kind === "crossing"
                ? "多亏你没有把我留在阵外。前面的路，我们继续一起看。"
                : intent.option === "gift"
                  ? "这枚丹药的分量，我记住了。等你叩关，我会在一旁护法。"
                  : "这一路是你自己走来的。拿好丹药，往后也别忘了照顾自己。";
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
