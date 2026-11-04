import type { State } from "../world";
/** Dates are hand-authored independent milestones, not the player's cultivation stage. */
export function companionChronology(s: State) {
  const q = s.foundationJourney;
  const met = s.social.metMonth;
  if (!s.social.met || met === null || met > s.month) return null;
  const baseAge = (s.social.gender === "male" ? 24 : 26) * 12;
  const elapsed = s.month - met;
  const age = baseAge + elapsed;
  // The male mainline records Su's own maps, expedition, supplies, and return.
  // No equivalent independent breakthrough has been written for Yin yet.
  const experience =
    s.social.gender === "male" &&
    q.heroine.map !== "none" &&
    q.heroine.expedition &&
    q.heroine.supplied &&
    q.rescue === 4 &&
    q.won.includes("rescue") &&
    q.inheritance !== "none" &&
    q.departedAt !== null &&
    q.epilogue;
  // Her preparation follows her departure and shared expedition, regardless of
  // when the player forms a golden core. Receipt of news is a separate command.
  const candidate = experience && q.departedAt! >= met && q.departedAt! <= s.month
    ? Math.max(met + 960, q.departedAt! + 600)
    : null;
  let goldenAt = candidate !== null && baseAge + candidate - met < 2400 ? candidate : null;
  // Keep an already-confirmed historical letter's exact date. The old formula
  // is consulted only to recognize that record, never to schedule new growth.
  const recorded = s.goldenStory.companionGoldenAt;
  const formed = s.goldenCore.formedAt;
  const legacyDate = candidate !== null && formed !== null && formed >= met
    ? Math.max(candidate, formed + 360) : null;
  if (recorded !== null && recorded === legacyDate && baseAge + recorded - met < 2400
      && s.goldenStory.companionLetters.includes(4)
      && s.goldenStory.companionConfirmedAt !== null
      && recorded <= s.goldenStory.companionConfirmedAt
      && s.goldenStory.companionConfirmedAt <= s.month) goldenAt = recorded;
  return { met, elapsed, age, goldenAt };
}
export function companionNews(s: State) {
  const time = companionChronology(s);
  if (!time) return null;
  const { elapsed, age, goldenAt } = time;
  const name = s.social.gender === "male" ? "苏婉宁" : "尹照川";
  const confirmed = s.goldenStory.companionGoldenAt;
  const confirmedAt = s.goldenStory.companionConfirmedAt;
  if (age >= 6000 || (goldenAt === null && confirmed === null && age >= 2400))
    return {
      id: 3,
      goldenAt: null,
      text: `驿使交来${name}早年留下的路图与旧信，落款年月仍清楚。信纸已经泛黄，此后再无近讯。驿使也说不清如今人在何处。`,
    };
  if (goldenAt !== null && s.month >= goldenAt && age < 6000) {
    const first = goldenAt - 240,
      recovery = goldenAt - 120;
    return {
      id: 4,
      goldenAt,
      text: `药路驿使送来苏婉宁亲署的来信，附着两封早年的短笺与此次核验的近况回执。她写道：“最初那一炉没成，所幸根基保住了。养伤十年，再取药、修护阵，又用了十年。第二回出关，总算结成了金丹。”早年修图与独自护送积下的经验，被她逐一用进了护体法里。她如今仍在复测药路的潮湿地段，邀你循旧信路约见。落款：初试第${first}月，伤愈第${recovery}月，凝丹第${goldenAt}月；近况于第${s.month}月核验。`,
    };
  }
  // Already-confirmed history remains reliable within its lifespan even if a
  // future migration cannot reconstruct the old route's exact eligibility.
  if (confirmed !== null && confirmedAt !== null && age < 6000)
    return {
      id: 4,
      goldenAt: confirmed,
      text: `你重读${name}第${confirmed}月凝丹、于第${confirmedAt}月核验近况的来信。新的会面仍须另行联络。`,
    };
  if (age >= 2400)
    return {
      id: 3,
      goldenAt: null,
      text: `驿使交来${name}的旧信，尚无后来突破的消息。旧信所写的住处已换了主人，驿使还在打听新的信路。`,
    };
  if (goldenAt !== null && s.month >= goldenAt - 120)
    return {
      id: 6,
      goldenAt: null,
      text: `苏婉宁在第${goldenAt - 120}月的药路回信中确认伤势已养好。上次失利耗去的药物由她重新护送、取药补齐；这回先重炼药性，再修补静室护持。“静室已经收拾妥当，这回再试一次。”此后尚无出关的消息。`,
    };
  if (goldenAt !== null && s.month >= goldenAt - 240)
    return {
      id: 5,
      goldenAt: null,
      text: `药路送来苏婉宁第${goldenAt - 240}月的短笺：她独自取药后的第一次凝丹失利，及时散去紊乱灵元保住根基，目前在静室养伤。旧路收入足够支持恢复，她打算养好伤再备一炉，托驿使告诉你不必挂心。`,
    };
  if (elapsed >= 600)
    return {
      id: 2,
      goldenAt: null,
      text: `${name}来信说，早年复测的旧路已交给后来人维护，自己用积攒的报酬换得闭关之地，正为凝丹筹备药物。“这一关，我想自己试过再告诉你。”信末列着尚缺的几味药，出关之日还未定。`,
    };
  if (elapsed >= 120)
    return {
      id: 1,
      goldenAt: null,
      text: `${name}寄来新旧两版路图：十年复测后，潮湿季节的落点终于接上了。护送所得用来温养本命器物，仍在筑基道路上修行，信末又画了一段准备复测的新路。`,
    };
  return {
    id: 0,
    goldenAt: null,
    text: `${name}的短笺沿旧有联络点送到：“我还在核验自己的路，先不随你渡海。”随信标出了两处已修好的歇脚点；墨迹旁还留着你们当年约好的记号。`,
  };
}

/** Read-only archive of the dated enclosures actually received with her news. */
export function companionLetterArchive(s: State): { month: number; text: string }[] {
  const g = s.goldenStory;
  const time = companionChronology(s);
  if (!time || s.social.gender !== "male") return [];
  const at = g.companionGoldenAt ?? time.goldenAt;
  if (at === null) return [];
  const confirmed = g.companionLetters.includes(4) && g.companionGoldenAt !== null;
  return [
    ...(confirmed || g.companionLetters.includes(5) ? [{ month: at - 240, text: "首次凝丹失利，及时散去乱流，留在静室养伤。" }] : []),
    ...(confirmed || g.companionLetters.includes(6) ? [{ month: at - 120, text: "养伤十年后伤势已愈，重新取药、修补护阵，筹备再试。" }] : []),
    ...(confirmed ? [{ month: at, text: "又过十年，第二次闭关结成金丹。" }] : []),
  ];
}
