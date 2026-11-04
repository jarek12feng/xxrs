import { projectInteractions } from "../story-interactions";
import { flowCue, revisionQuote, type PactRevisionAction } from "./revision";
import { pactQuote } from "./rules";
import { hasEquippedRelic } from "../equipment";
import type { State } from "../world";
import { challenges } from "../foundation-journey/content";
import { foundationPower } from "../foundation-journey/combat";
import { mainTraining, supportTraining } from "../growth";
import type { PactAction } from "./rules";
export function pactView(s: State) {
  const p = s.secretPact,
    q = s.foundationJourney;
  let next =
    "叶照带来古道支脉的石门拓图，贺崇说内中或藏补脉古法。三人须到筑基中期，才能抵住门内罡风；照玄护脉法可接续守势与识阵，伤害 +6、承伤 −3。贺崇也为此而来，能入府，未必争得过他。";
  const actions: { action: PactAction; label: string; detail: string }[] = [];
  const add = (action: PactAction, label: string, detail = "") =>
    actions.push({ action, label, detail });
  if (["none", "declined"].includes(p.stage)) {
    add(
      "promise",
      "约定中期同行",
      "可暂缓出发，不按现实时间失约；三地任选一路取材即可赴约，不必重做古道主材。",
    );
    if (p.stage === "none")
      add(
        "decline",
        "暂不同行",
        "暂缓同行；晋后期前仍需回来完成照玄历练，不强迫争宝。",
      );
  } else if (p.stage === "promised") {
    next =
      q.cultivation < 200
        ? "贺崇已至中期，仍在寻治伤之法。叶照来信说阵具已备好，等你灵息稳固。先修至筑基中期，三地任选一路取材后会合。"
        : "叶照传来会合方位，贺崇已备好护门之剑。三地任一取材后从地图赴照玄。抵达后亲手护阵、辨流、破门，再商议分宝。";
    add(
      "enterAnchor",
      "备药留退路",
      "一月，灵草 2；若贺崇毁约，叶照可依阵钉使争宝首合承伤 −4。",
    );
    add(
      "enterLight",
      "轻装入府",
      "一月，不耗灵草；争宝首合因退路不稳承伤 +3。",
    );
  } else if (p.stage === "inside" && p.trial === "division") {
    next =
      "玉简仅可传法一人。照玄护脉法：筑基交锋中，守势后接识阵，伤害 +6、承伤 −3。";
    add(
      "yield",
      "让他受法，收下补偿",
      "灵石 +24；不得护脉法，贺崇日后愿寄补给。",
    );
    add(
      "insist",
      "暂不让宝，要求继续议价",
      "贺崇不肯让宝，会毁约相争；可再选择应战或退走。",
    );
    add(
      "seize",
      "趁验阵先夺玉简",
      "你先毁约，会引发交锋；叶照不再护阵或同行，即使胜出也无旧友补给。",
    );
    add(
      "leave",
      "不争此物，保全所得离府",
      "放弃玉简，不额外损失此前所得，双方不因此结仇。",
    );
  } else if (p.stage === "betrayed") {
    next =
      p.aggressor === "rival"
        ? "贺崇先毁约夺简。可应战夺回，也可带着已有主材退出，日后再定追索与否。"
        : "你先破约，叶照不再护阵。可继续争夺，也可就此退走。";
    add(
      "leave",
      "保全所得退出",
      "不新增伤势；日后可回古道追索，也可传信止争。",
    );
  } else {
    const enemy = ["won", "seized", "retreated"].includes(p.outcome);
    next = p.settled
      ? "旧怨已了，双方不再追索，交情亦未恢复。继续自己的修行，无须重复回府。"
      : enemy
        ? "夺宝旧怨尚在。追索只涉及这份传承，不封锁晋升与主线。可应对旧怨，也可继续自己的道途。"
        : "此番分取已定。三人各有所得或各自离去；既有古道主材仍可照常处理，不必再闯一遍外缘。";
    if (["exchange", "yield"].includes(p.outcome) && !p.supplies)
      add(
        "supplies",
        "收取贺崇寄来的补给",
        "一次回春散 2；不耗月份，无须回旧地。",
      );
    if (enemy && !p.settled && !p.hazard)
      add(
        "settle",
        "传信了结旧怨",
        p.manual && p.aggressor === "player"
          ? "灵草 6、灵石 24，助他另寻治伤之法；保留已学护脉法，双方不再追索，不恢复同行。"
          : p.manual ? "叶照核对先毁约的事实，免费止争；已学护脉法保留，不欠玉简。" : "放弃追索玉简，双方互不寻仇；不恢复同行。",
      );
  }
  if (p.hazard) {
    actions.length = 0;
    const cue = flowCue(s);
    next = `${cue ? cue.text : ""} 护体 ${p.hazard.hp}/100，通路 ${p.hazard.progress}/3。失误承伤 ${p.preparation === "anchor" || p.pursuitPrepared ? 35 : 45}；六合未完成或护体耗尽即败退，伤势 +2。`;
    add(
      "guardFlow",
      p.site === "brokenStele" ? "守势接招" : "护住阵脚",
      "承住正面逆流，给归绳留出空隙。",
    );
    add(
      "readFlow",
      p.site === "brokenStele" ? "辨明剑影" : "辨明回流",
      "辨出与出口相连的细流。",
    );
    add(
      "breakFlow",
      p.site === "brokenStele" ? "趁隙反击" : "切开阵隙",
      "趁已辨明的阵隙打开通路。",
    );
    add("withdrawFlow", "沿归绳撤回", "无新增伤势；未完成的历练不会算作通过。");
  } else if (
    ["crossing", "escape", "stabilize"].includes(p.trial) &&
    p.site === "zhaoxuan"
  ) {
    actions.length = 0;
    next =
      p.trial === "crossing"
        ? "门外逆流尚未走通。可以先静养整备，再重新护阵。"
        : "分宝已定，离府逆流尚未完成。稳住循环才能晋后期；让宝与夺宝都不能跳过。";
    add(
      "retryFlow",
      p.trial === "crossing" ? "重入门前逆流" : "稳住离府通路",
      "一月；三段实战，失误会受伤，已得主材与法门不丢。",
    );
  }
  if (!p.hazard && p.trial !== "division") {
    const story: [PactRevisionAction, string, string][] = [
      ["identityAccept", "接下护药合作", "可在方便时协助，不强加固定任职。"],
      ["identityDecline", "婉拒固定职责", "保留求教与同行渠道；散修不添宗籍。"],
      [
        "observeScale",
        "核对沉井旧刻度",
        "对照水位，留下有限观察，不断言全界秘密。",
      ],
      ["foreignNews", "核对外宗货单", "亲自核对取材地的药材与修阵往来。"],
      [
        "replyHome",
        "托药队转交回信",
        "旧信不等于亲人当前安危；请药队核实投递。",
      ],
      ["keepHome", "收好家乡旧信", "暂不投递，不妨碍继续道途。"],
      ["notice", "收断碑驿来信", "只在安全交接后告知，没有隐藏期限。"],
      ["preparePursuit", "备好对质药包", "灵草 2；失误承伤从 45 降至 35。"],
      [
        "confront",
        "院中较量，胜后止争",
        "一月；不杀人，不退还已学法门，败退伤势 +2 可再来。",
      ],
      [
        "witness",
        "请见证人核对旧约",
        p.aggressor === "player"
          ? "承认先毁约，草 6、石 24 作治伤补偿；不会恢复信任。"
          : "贺崇先毁约，叶照作证，免费止争；不欠玉简。",
      ],
    ];
    for (const [a, label, detail] of story)
      if (!revisionQuote(s, a).error) add(a, label, detail);
  }
  const power = foundationPower(s);
  const preparation = [
    s.injury ? `伤势 ${s.injury}：先静养，免得带伤争宝。` : "伤势已平。",
    mainTraining(s) < 2 ? "主修尚未通达，可到功法页研修。" : "主修已通达。",
    !hasEquippedRelic(s, 2)
      ? "可到灵器页精炼法器，补足攻守。"
      : "已备二阶灵器。",
    supportTraining(s) < 2
      ? "辅修仍可研修，护身之力尚有余地。"
      : "辅修已通达。",
    "长春守势需留灵草；也可先炼化所选路线主材、提升修为，再来赴约。",
  ];
  return {
    preparation,
    power,
    rival: challenges.pactRival,
    next,
    actions: projectInteractions(s, actions, pactQuote),
    visible: s.realm === 1,
    fight:
      !p.hazard &&
      p.site === "zhaoxuan" &&
      (p.stage === "betrayed" ||
        (p.outcome === "retreated" && !p.settled)),
    relationship: p.settled
      ? "旧怨已了"
      : p.aggressor === "player"
        ? "贺崇结怨 · 叶照失信"
        : p.aggressor === "rival"
          ? "贺崇结怨 · 叶照作证"
          : ["exchange", "yield"].includes(p.outcome)
            ? "分取守约 · 同行情谊尚在"
            : p.stage === "resolved"
              ? "各循其路"
              : "同道相约",
  };
}
