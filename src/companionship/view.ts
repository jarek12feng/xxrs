import { plans } from "./content";
import type { State } from "../world";
import {
  availablePlans,
  companionshipError,
  methodError,
  type CompanionAction,
  type Method,
} from "./rules";
export function companionshipView(s: State) {
  const q = s.companionship,
    shen = s.social.gender === "male";
  const blocked = companionshipError(s);
  const options: {
    action: CompanionAction;
    label: string;
    hint: string;
    disabled: string;
  }[] = [];
  if (q.stage === "unstarted")
    options.push({
      action: "start",
      label: "商量这次同行",
      hint: "可随时返回修行；不要求定情，不推进月份",
      disabled: blocked,
    });
  if (q.stage === "prepare") {
    for (const [method, label, hint] of [
      [
        "strength",
        shen ? "稳石卸力，让她测量坡度" : "分开乱流，与他配合灯讯",
        "根骨 + 剑意 ≥12；不耗材料",
      ],
      [
        "insight",
        shen ? "辨清稳固节点，一起核对落脚处" : "辨认回流节点，校正风标",
        "神识 ≥8、心得 ≥2；不消耗",
      ],
      [
        "supplies",
        shen ? "调药护根，沿尺绳探路" : "护脉稳阵，以灯讯引船",
        "消耗灵草 4",
      ],
    ] as const)
      options.push({
        action: method,
        label,
        hint,
        disabled: blocked || methodError(s, method as Method),
      });
  }
  if (q.stage === "dispute")
    for (const plan of availablePlans(s)) {
      const config = plans[plan];
      options.push({
        action: plan,
        label: config.label,
        hint:
          plan === "public"
            ? "不耗材料；旅人需问路，药工轮值引导"
            : plan === "detour"
              ? "灵石 −6；错过本次刻印，药队先护粮再维护"
              : plan === "relay"
                ? "灵石 −6；两位渡工交叉校验，保留正常夜航"
                : "不耗材料；暂减夜航班次，药船延至天明",
        disabled:
          blocked ||
          (s.stones < config.cost ? `需要灵石 ${config.cost}；可劳作筹措` : ""),
      });
    }
  if (q.stage === "trial")
    options.push({
      action: "test",
      label: "亲自校验归路",
      hint:
        s.journey.support === "guard"
          ? "护身诀已装配：新增伤势 0，完成交接"
          : "未装配护身诀：新增伤势 2，退回重试；可先到功法页装配",
      disabled:
        blocked || (s.injury > 2 ? "先免费静养，将伤势降至 2 或以下" : ""),
    });
  if (q.stage === "done")
    options.push({
      action: "revisit",
      label: "回访这条归路",
      hint: "查看留下的安排，不重复领取奖励",
      disabled: blocked,
    });
  const conflict = shen
    ? "试印图送到药舍，一家人为井口与果树的标记找来：他们拒绝了以孩子抵债的私约，不愿公开住处。沈听澜起初说“我没写名字”，细看后却沉默了。运粮队正等公共路图；你们得决定怎样保住通路，也保住人的边界。"
    : "空船归泊后，尹照川又往每个夜班填自己的名字。学徒曾误读风标，但旧修补后的半格偏差没有写进规程。他认下漏记，却仍想一个人守完。你也要闭关、远行，不能靠无限代班解决；这次需要一个能交接的办法。";
  return {
    title: shen ? "图上没有你的名字" : "留一盏不等人的灯",
    stage: {
      unstarted: "相约",
      prepare: "准备与协作",
      dispute: "同路不同意",
      trial: "试用与交接",
      done: "归路有了回应",
    }[q.stage],
    body:
      q.stage === "dispute"
        ? conflict
        : q.last ||
          (shen
            ? "为自己的远行勘路。你稳住险段，她量出凡人能走的坡度；共同历险后，再决定图该怎样公开。"
            : "为自己的远行练习护身与稳阵。你在上游校验，他守主灯报信；让这条归路不再只靠一个人值守。"),
    last: q.last,
    image: `/art/companionship/${shen ? (q.stage === "done" ? "print-workshop" : "survey-shelter") : "lamp-room"}.webp`,
    portrait: `/art/companionship/${shen ? "shentinglan" : "yinzhaochuan"}-${q.stage === "dispute" ? "disagree" : q.stage === "prepare" ? "travel" : "work"}.webp`,
    name: shen ? "沈听澜" : "尹照川",
    options,
    reward:
      "完成险段可习得护身诀（已有则心得 +2，上限 4）。装配后交锋每合减伤 2，历练不新增伤势；归路试验也会用到它。",
  };
}
