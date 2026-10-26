import type { State } from "./chapter";

// Projection only: presentation never changes the story or its random seed.
export function luchiView(s: State) {
  const kind = s.pending?.kind;
  const portrait =
    s.story.luchi === "foundation"
      ? "foundation"
      : kind === "meeting" || kind === "crossing"
        ? "injured"
        : s.memories.confided || kind === "visit"
          ? "relieved"
          : "base";
  const scene =
    kind === "meeting"
      ? "/characters/luchi-ferry.png"
      : kind === "relic"
        ? "/characters/luchi-relic.png"
        : null;
  const whereabouts =
    kind === "meeting"
      ? "听松山下 · 渡口初逢"
      : kind === "letter" || kind === "visit"
        ? "听松山居 · 与你相叙"
        : s.story.luchi === "stranger"
          ? "听松山下 · 渡口未逢"
          : s.story.luchi === "foundation"
            ? "听松山 · 守在你的洞府外"
            : s.story.luchi === "distant"
              ? "山外 · 去向不明"
              : s.story.choice === "self"
                ? "归乡途中 · 陪母亲过冬"
                : s.story.stage === "crossing" || s.story.stage === "relic"
                  ? "青石遗府 · 与你同行"
                  : s.month >= 24
                    ? "渡口 · 准备三年之约"
                    : "山下集市 · 为赴约奔走";
  const known = s.memories.confided
    ? "他想筑基，是为了入山寻找失踪的父亲，让守灯的母亲不必再等。"
    : s.story.stage === "unmet"
      ? "你还不知道渡口那名散修的故事。"
      : "寡言，记人恩情。旧剑上有三道刻痕，他从不肯换。";
  const quote =
    s.story.luchi === "stranger"
      ? "渡口有人倚剑而坐，似乎在等一封回信。"
      : s.story.luchi === "foundation"
        ? "“这回，你安心闭关。我在门外。”"
        : s.story.choice === "self"
          ? "“我先回家。等你出关，替我去山里看一眼。”"
          : kind === "visit"
            ? "“上回是你帮我。这次，换我。”"
            : s.memories.confided
              ? "“我想让那盏灯，等到一个归来的人。”"
              : "“第三十六个月，我在渡口等你。”";
  return {
    portrait: "/characters/luchi-" + portrait + ".png",
    scene,
    whereabouts,
    known,
    quote,
  };
}
