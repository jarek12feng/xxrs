import type { Option, State as ChapterState } from "./chapter";
type State = Omit<ChapterState, "version"> & { qiJourney?: { gates: number } };

// Progress is derived from durable chapter outcomes; no second quest ledger.
export function hasFoundationRecipe(s: State) {
  return (
    s.story.choice === "self" || s.story.choice === "gift" || s.crafted > 0
  );
}
export function breakthroughError(s: State) {
  if (s.status !== "alive") return "这段修行已经结束";
  if (s.pending) return "先处理眼前的选择";
  if (s.realm) return "已经筑基";
  if(s.qiJourney && s.qiJourney.gates<2) return "先完成淬脉与内府凝元，取得圆满晋升资格";
  if(s.qiJourney && s.injury) return "先养好伤势，再让经脉承受筑基药力";
  if(s.qiJourney && s.foundation<12) return "先固本至根基12；道基不稳，不能承受筑基药力";
  if (s.qi < 360) return `还差 ${360 - s.qi} 修为`;
  if (!s.pills)
    return hasFoundationRecipe(s)
      ? "丹方已得，先补炼一枚筑基丹"
      : "先闯过青石遗府，取得筑基丹与丹方";
  return "";
}
export function relicJourneyError(s: State) {
  if (s.status !== "alive" || s.pending) return "先处理眼前事件";
  if (s.realm || hasFoundationRecipe(s)) return "遗府机缘已经取得";
  if (s.story.choice === "missed") return "";
  if (s.story.stage === "waiting" && s.month >= s.story.deadline) return "";
  return "约定开府之月遗府开启，先修行并准备破阵手段";
}
export function foundationGoal(s: State) {
  if (s.realm) return "筑基已成：重返青嶂旧阵，尝试炼气时无法承受的交锋。";
  if(s.qiJourney && s.qiJourney.gates<2) return s.qiJourney.gates===0 ? "当前目标是淬脉、突破后期瓶颈；药谷淬脉泉的凝露草可温养经脉。" : "淬脉已成，当前目标是凝元；青石内府藏有凝元晶髓，药窟杂气也须亲自化解。";
  if (s.pills)
    return `筑基丹已备齐。${s.qi < 360 ? `还差 ${360 - s.qi} 修为；` : ""}疗伤与固本能提高把握，突破时必消耗一枚。`;
  if (hasFoundationRecipe(s))
    return "遗府丹方已记下。备齐灵草与灵石，补炼筑基丹；失败不必重闯遗府，剑修也可凭丹方炼制。";
  if (s.story.choice === "missed")
    return "陆迟已独行，旧约无法挽回；你仍可独自重返遗府，闯过石阵取丹。";
  return "约定开府之月与陆迟探青石遗府，争取自己的筑基丹与补炼丹方。修为达到 180，再备一种破阵手段即可；不必把所有属性练满。";
}

// Shared by the preparation view and actual choice validation.
export function foundationPassages(s: State): Option[] {
  const alone = s.story.choice === "missed";
  const options = [
    ...(s.realm
      ? [{ id: "protect", label: "以筑基修为护送", hint: "无伤通过 · 信任 +1" }]
      : []),
    ...(s.inherited === "bond"
      ? [
          {
            id: "memory",
            label: "沿梦中的旧路绕行",
            hint: "前缘专属 · 无伤通过 · 信任 +1",
          },
        ]
      : []),
    {
      id: "endure",
      label: alone ? "以山岳根骨承受阵压" : "以山岳根骨护住陆迟",
      hint: "根骨至少 8 · 伤势 +1 · 信任 +1",
      disabled: s.root < 8 ? "需要根骨 8" : undefined,
    },
    {
      id: "sense",
      label: "以神识窥见阵眼",
      hint: "神识至少 8 · 无伤通过 · 信任 +1",
      disabled: s.sense < 8 ? `神识 ${s.sense}/8` : undefined,
    },
    {
      id: "decipher",
      label: "参透石门残诀",
      hint: "悟性至少 8、研读心得 2 · 无伤通过 · 信任 +1",
      disabled:
        s.wisdom < 8 || s.study < 2
          ? `悟性 ${s.wisdom}/8、心得 ${s.study}/2`
          : undefined,
    },
    {
      id: "medicine",
      label: "以灵草解瘴",
      hint: "灵草 −4 · 无伤通过 · 信任 +1",
      disabled: s.herbs < 4 ? `灵草 ${s.herbs}/4` : undefined,
    },
    {
      id: "blade",
      label: "以剑意破阵",
      hint: "剑意至少 4 · 伤势 +1 · 信任 +1",
      disabled: s.mastery < 4 ? `剑意 ${s.mastery}/4` : undefined,
    },
  ];
  return options.map((o) => ({
    ...o,
    hint: alone ? o.hint.replace(" · 信任 +1", "") : o.hint,
    disabled:
      !s.realm && s.qi < 180
        ? `修为 ${s.qi}/180；${o.disabled || "手段已具备"}`
        : o.disabled,
  }));
}
