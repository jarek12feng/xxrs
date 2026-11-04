import { sceneOwner } from "../scene-activity";
import type { State } from "../core";
export type StoryChapter =
  | "lizhao"
  | "nascent"
  | "opening"
  | "road"
  | "mist"
  | "qi"
  | "foundation"
  | "contest"
  | "golden"
  | "sea"
  | "conclave"
  | "rewards"
  | "practice";
export function storyChapters(
  s: State,
  showRoad = false,
): { id: StoryChapter; label: string }[] {
  // Earned but unclaimed gifts remain accessible after realm advancement.
  const rewards: { id: StoryChapter; label: string }[] =
    (s.adventure.step === "done" && !s.journey.learning.book) ||
    (s.expedition.cleared >= 1 && !s.journey.learning.relic)
      ? [{ id: "rewards", label: "归来谢礼" }]
      : [];
  if (s.realm === 3) return [{id:"nascent",label:"元婴初成"}, ...rewards];
  if (s.realm === 2) {
    if (!s.goldenCore.farShore)
      return [{ id: "golden", label: "云壁之外" }, ...rewards];
    const choices: { id: StoryChapter; label: string }[] = [
      { id: "sea", label: "外海行旅" },
    ];
    if (s.outerSea.notice !== null || s.outerSea.cleared === 2)
      choices.push({ id: "conclave", label: "来信与诸宗会" });
    if (s.conclave.stage >= 2) choices.push({id:"lizhao",label:"离照洞天"},{id:"nascent",label:"圆满与凝婴"});
    return [...choices, ...rewards];
  }
  if (s.realm === 1) {
    const choices: { id: StoryChapter; label: string }[] = [
      { id: "foundation", label: "筑基行旅" },
    ];
    if (s.adventure.mist.stage !== "dormant") {
      const mist = { id: "mist" as const, label: "雾海寻信" };
      if (!showRoad) choices.unshift(mist);
      else choices.push(mist);
    }
    if (
      ["invited", "preparing", "entered", "finished"].includes(
        s.sectContest.stage,
      )
    )
      choices.push({ id: "contest", label: "宗门邀约" });
    if (s.foundationJourney.cultivation >= 200)
      choices.push({ id: "golden", label: "凝丹筹备" });
    choices.push({ id: "road", label: "青嶂旧路" });
    return [...choices, ...rewards];
  }
  if (s.adventure.step !== "done")
    return [{ id: "opening", label: "寻人入山" }];
  const choices: { id: StoryChapter; label: string }[] = [
    {
      id: !showRoad && s.adventure.mist.stage !== "dormant" ? "mist" : "road",
      label: "当前行旅",
    },
    { id: "qi", label: "炼气历练" },
  ];
  if (choices[0].id === "mist") choices.push({ id: "road", label: "青嶂旧路" });
  choices.push(...rewards);
  if (s.journey.learning.book && s.journey.main && !s.adventure.road.thanked)
    choices.push({ id: "practice", label: "药庐试招" });
  return choices;
}
export function storyChapter(
  s: State,
  preferred: string,
  showRoad = false,
): StoryChapter {
  const owner = sceneOwner(s);
  if (owner) return owner;
  const available = storyChapters(s, showRoad);
  return available.find((x) => x.id === preferred)?.id ?? available[0].id;
}
