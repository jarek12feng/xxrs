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
  const candidate =
    experience && q.departedAt! >= met && q.departedAt! <= s.month
      ? Math.max(met + 960, q.departedAt! + 600)
      : null;
  let goldenAt =
    candidate !== null && baseAge + candidate - met < 2400 ? candidate : null;
  // Keep an already-confirmed historical letter's exact date. The old formula
  // is consulted only to recognize that record, never to schedule new growth.
  const recorded = s.goldenStory.companionGoldenAt;
  const formed = s.goldenCore.formedAt;
  const legacyDate =
    candidate !== null && formed !== null && formed >= met
      ? Math.max(candidate, formed + 360)
      : null;
  if (
    recorded !== null &&
    recorded === legacyDate &&
    baseAge + recorded - met < 2400 &&
    s.goldenStory.companionLetters.includes(4) &&
    s.goldenStory.companionConfirmedAt !== null &&
    recorded <= s.goldenStory.companionConfirmedAt &&
    s.goldenStory.companionConfirmedAt <= s.month
  )
    goldenAt = recorded;
  return { met, elapsed, age, goldenAt };
}
/** World outcome is independent from receipt and explicit player confirmation. */
export function companionMilestone(s: State) {
  const time = companionChronology(s);
  if (!time) return null;
  const { met, elapsed, age, goldenAt } = time;
  const confirmed = s.goldenStory.companionGoldenAt;
  const confirmedAt = s.goldenStory.companionConfirmedAt;
  if (age >= 6000 || (goldenAt === null && confirmed === null && age >= 2400))
    return {
      id: 3,
      month:
        met +
        (age >= 6000 ? 6000 : 2400) -
        (s.social.gender === "male" ? 288 : 312),
      goldenAt: null,
    };
  if (goldenAt !== null && s.month >= goldenAt && age < 6000)
    return { id: 4, month: goldenAt, goldenAt };
  if (confirmed !== null && confirmedAt !== null && age < 6000)
    return { id: 4, month: confirmed, goldenAt: confirmed };
  if (age >= 2400)
    return {
      id: 3,
      month: met + 2400 - (s.social.gender === "male" ? 288 : 312),
      goldenAt: null,
    };
  if (goldenAt !== null && s.month >= goldenAt - 120)
    return { id: 6, month: goldenAt - 120, goldenAt: null };
  if (goldenAt !== null && s.month >= goldenAt - 240)
    return { id: 5, month: goldenAt - 240, goldenAt: null };
  if (elapsed >= 600) return { id: 2, month: met + 600, goldenAt: null };
  if (elapsed >= 120) return { id: 1, month: met + 120, goldenAt: null };
  return { id: 0, month: met, goldenAt: null };
}
export function companionNews(s: State) {
  const milestone = companionMilestone(s);
  const time = companionChronology(s);
  if (!time || !milestone) return null;
  const { goldenAt } = time;
  const name = s.social.gender === "male" ? "苏婉宁" : "尹照川";
  const confirmed = s.goldenStory.companionGoldenAt;
  const confirmedAt = s.goldenStory.companionConfirmedAt;
  if (
    milestone.id === 3 &&
    (s.month >= time.met + 6000 - (s.social.gender === "male" ? 288 : 312) ||
      (goldenAt === null && confirmed === null))
  )
    return {
      id: 3,
      goldenAt: null,
      text: `驿使交来${name}早年留下的路图与旧信，落款年月仍清楚。信纸已经泛黄，此后再无近讯。驿使也说不清如今人在何处。`,
    };
  if (milestone.id === 4 && goldenAt !== null && s.month >= goldenAt) {
    return {
      id: 4,
      goldenAt,
      text: `药路驿使送来苏婉宁的信，里面还夹着两封早年的短笺。“第一炉没成。散去灵元时，我手都在抖，好在根基保住了。养伤十年，再取药、修护阵，又是十年。这回出关，院里的树已高过屋檐——我结成金丹了。\n你若来，还是循旧信路。我在那段潮湿的药路上留了新记号，可别照着旧图走。还有，先别笑我：报喜这几句话，我写了三遍。”信末落着她出关的年月：第${goldenAt}月。`,
    };
  }
  // Already-confirmed history remains reliable within its lifespan even if a
  // future migration cannot reconstruct the old route's exact eligibility.
  if (milestone.id === 4 && confirmed !== null && confirmedAt !== null)
    return {
      id: 4,
      goldenAt: confirmed,
      text: `你重读${name}报喜的来信：她在第${confirmed}月结成金丹，这封信于第${confirmedAt}月送到你手中。新的会面仍须另行联络。`,
    };
  if (milestone.id === 3)
    return {
      id: 3,
      goldenAt: null,
      text: `驿使交来${name}的旧信，尚无后来突破的消息。旧信所写的住处已换了主人，驿使还在打听新的信路。`,
    };
  if (milestone.id === 6 && goldenAt !== null)
    return {
      id: 6,
      goldenAt: null,
      text: `苏婉宁在第${goldenAt - 120}月的药路回信中确认伤势已养好。上次失利耗去的药物由她重新护送、取药补齐；这回先重炼药性，再修补静室护持。“静室已经收拾妥当，这回再试一次。”此后尚无出关的消息。`,
    };
  if (milestone.id === 5 && goldenAt !== null)
    return {
      id: 5,
      goldenAt: null,
      text: `药路送来苏婉宁第${goldenAt - 240}月的短笺：她独自取药后的第一次凝丹失利，及时散去紊乱灵元保住根基，目前在静室养伤。旧路收入足够支持恢复，她打算养好伤再备一炉，托驿使告诉你不必挂心。`,
    };
  if (milestone.id === 2)
    return {
      id: 2,
      goldenAt: null,
      text: `${name}来信说，早年复测的旧路已交给后来人维护，自己用积攒的报酬换得闭关之地，正为凝丹筹备药物。“这一关，我想自己试过再告诉你。”信末列着尚缺的几味药，出关之日还未定。`,
    };
  if (milestone.id === 1)
    return {
      id: 1,
      goldenAt: null,
      text: `${name}寄来新旧两版路图：十年复测后，潮湿季节的落点终于接上了。护送所得用来温养本命器物，仍在筑基道路上修行，信末又画了一段准备复测的新路。`,
    };
  return {
    id: 0,
    goldenAt: null,
    text: `${name}的短笺沿旧有联络点送到：“这段路还有几处落点没走踏实，我想再留一阵。你先渡海，沿途见到什么，记得写信告诉我。”随信标出了两处已修好的歇脚点；墨迹旁还留着你们当年约好的记号。`,
  };
}

/** Read-only archive of the dated enclosures actually received with her news. */
export function companionLetterArchive(
  s: State,
): { month: number; text: string }[] {
  const g = s.goldenStory;
  const time = companionChronology(s);
  if (!time || s.social.gender !== "male") return [];
  const at = g.companionGoldenAt ?? time.goldenAt;
  if (at === null) return [];
  const confirmed =
    g.companionLetters.includes(4) && g.companionGoldenAt !== null;
  return [
    ...(confirmed || g.companionLetters.includes(5)
      ? [
          {
            month: at - 240,
            text: "首次凝丹失利，及时散去乱流，留在静室养伤。",
          },
        ]
      : []),
    ...(confirmed || g.companionLetters.includes(6)
      ? [
          {
            month: at - 120,
            text: "养伤十年后伤势已愈，重新取药、修补护阵，筹备再试。",
          },
        ]
      : []),
    ...(confirmed
      ? [{ month: at, text: "又过十年，第二次闭关结成金丹。" }]
      : []),
  ];
}
