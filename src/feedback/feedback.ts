import type { State } from "../world";
import { stage } from "../playtest/record";
import { build, playableScope } from "./build";
/** Explicit allowlist: never serialize State, logs, seed, name, or imported saves. */
export function feedbackSummary(
  game: State | null,
  runtime: string,
  answers: { problem: string; steps: string; expected: string } = {
    problem: "",
    steps: "",
    expected: "",
  },
) {
  return [
    "长生未央 · 试玩反馈",
    `版本：${build.version} / ${build.id}`,
    `运行方式：${runtime}`,
    playableScope,
    `进度：${stage(game)}`,
    `游戏月份：${game?.month ?? "尚未建角"}`,
    `存档格式：${game?.version ?? "尚无存档"}`,
    "",
    "遇到的问题或建议：",
    answers.problem,
    "发生前做了什么：",
    answers.steps,
    "希望怎样改善：",
    answers.expected,
    "反馈邮箱：jarek840713@gmail.com",
    "可自行补充系统版本、分辨率或截图。自动信息不含角色姓名、随机种子和完整存档；请检查自行填写的内容后再发送。",
  ].join("\n");
}
