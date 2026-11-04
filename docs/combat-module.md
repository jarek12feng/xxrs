# 战斗模块与调用约定

2026-11-04：`CombatEncounter.responses` 可由章节提供当前可见阶段的多个有效应对；`correctResponse` 统一基础与装备计算，未提供时保留 pattern。会谷／归潮首次采用；`tacticalPreview` 支持 `useHerbs:false`，仅关闭本次治疗用药。详见 [P1 实施](challenge-payoff-review/p1/README.md)。

2026-11-04。范围：现有逐回合交锋、一次性概率遭遇和章节效果接口，不调整数值、章节奖励、时间或持久化格式。

## 对外接口

纯规则入口为 `src/combat/index.ts`，不导入 Vue、浏览器、全局 State、剧情、存储或时钟。调用方只需提供本场气势、对手、能力投影与招式。

| 接口 | 输入与输出 | 约束 |
| --- | --- | --- |
| `startBattle(playerHp, enemyHp)` | 返回初始 `hp/enemy/turn` | 气势必须为正整数，否则抛 RangeError |
| `previewAction(context)` | 返回伤害、承伤、治疗、耗草、说明和效果标识 | 只读；无随机消耗；未知招式返回 null |
| `resolveTurn(battle, exchange, policy)` | 返回新战斗状态、胜负、耗草与回合数值 | 接收本回合最终计算结果；不修改参数；已终结或到回合上限时抛 RangeError |
| `previewArenaAction(context)` | 返回早期试剑榜预估，包含承伤范围 | 保留原试剑榜公式；不消耗随机数 |
| `previewEncounter(profile)` | 返回一次性遭遇的九项胜率分解、总胜率、失败伤势 | 只读；保留原来的 5%–100% 范围 |
| `resolveEncounter(preview, seed)` | 返回胜负、实际伤势、骰值与新种子 | 每次真实挑战只消耗一次原有 xorshift |
| `resolveArenaAction(context, seed)` | 返回新状态、胜负、实际消耗、新种子 | 每合严格消耗一次原有 xorshift；双方归零算败，最多六合 |

`src/combat/game.ts` 是游戏状态适配层，提供 `readiness`、`tacticalPreview` 和 `arenaContext`。已有章节通过它把角色成长、功法、装备与境界压制投影给纯内核。独立模拟或新模块可以直接使用 `combat/index.ts`，无需构造整局 State。

装备能力从 `equipment` 的公共接口取得：基础投影一次调用 `evaluateEquipment(..., {kind:'base', includeAttuned:true})`；回合器纹/辅器调用 `equipmentTurnEffect`。镇潮印和定神珠温养只计一次。早期试剑榜保留原有仅主器基础投影。

## 调用示例

```ts
import { startBattle, previewAction, resolveTurn } from "./combat";

const battle = startBattle(40, 100);
const preview = previewAction({
  battle,
  move: "guard",
  effect: "none",
  encounter: { hp: 100, attack: 20, pattern: ["guard", "strike", "discern"] },
  profile: {
    power: { hp: 40, damage: 10, armor: 3 },
    main: "spring", mainActive: true, lantern: false, herbs: 2,
    equipment: { damage: 0, incoming: 0, note: "" },
  },
});
if (preview) {
  const result = resolveTurn(battle, preview, {
    turnLimit: 12,
    resolution: "journey",
  });
  // 命令处理层写回 result.battle、扣 result.herbs，并处理 result.outcome。
  // 显示预估不调用命令；真实结果成功保存后才播放演出。
}
```

同一次动作必须使用同一个战前快照生成最终预估并结算；不能把旧预估应用到另一回合。接口假定章节准入和存档校验已经通过，`resolveTurn` 的 exchange 来自本回合计算，不能接受 UI 自行提交的伤害/治疗值。命令层仍负责事件锁定、操作去重、资源可用性、持久化失败处理；UI 只能发招式意图。

## 已接入的调用方

- 护送、炼气行旅、筑基行旅：`journey` 结算，击败敌人后保留自身气势、不再承受反击；回合上限分别为 12、16、12。
- 宗门内比、凝丹药圃、外海、诸宗会：`simultaneous` 结算，先应用双方气势变化，再按敌人倒下优先判断胜负；回合上限分别为 12、16、16、18。
- 早期试剑榜：使用独立的 arena 规则实现。随机浮动、剑经抢先收势、存活后治疗和六合限制保持原样。
- 第一册功法练习：只调用 `tacticalPreview`，不生成命令、不耗资源。

现有章节的 `duel` 字段、命令、校验器和存档版本保留。适配层写回公共的 `hp/enemy/turn`，章节专有的对手 ID、规则版本、协作和招式记忆继续留在章节存档。试剑榜将现有 `enemyHp` 映射为内核的 `enemy`，不改变序列化结构。

旧 `tacticalExchange` 包装已删除，应用、测试和审计工具都已迁移到命名参数接口。`readiness` 与 `combatStyle` 从 `combat/game.ts` 获取，不再由护送模块转导出；护送模块只保留本章节的 `exchangePreview` 和 `moveHint`。原 `expedition/content.ts` 的招式导出复用公共战斗类型。

## 计算顺序与职责

通用战术计算仍按原有顺序执行：基础攻守与正确应对 → 主修招式 → 阵核/上一招影响 → 器纹与辅器 → 境界压制 → 击杀免反击 → 存活后治疗。

筑基使用 `rules: "prepared"`，由引擎完成整个顺序：通用基础 → 传承 → 章节战术 → 同行协作 → 境界压制 → 击杀 → 治疗。删除中途两次最终会被覆盖的治疗重算，基础战力每次预估只求一次。章节特有的敌人变化、准备条件与协作资格仍由章节解释，不能让公共引擎认识剧情人物和任务阶段。

诸宗会归潮深层未温养时的额外承伤通过 `afterHealing` 效果交给引擎，保留原来的追加位置；本次未借重构调整其与击杀/治疗的关系。相关结算差异由测试固定，后续玩法调整应单独给出对照。

战斗结束只返回结果。奖励、伤势、排名、NPC 去向、秘境进度与撤退后去处由章节处理。筑基首胜后果从战斗计算文件分到 `foundation-journey/outcome.ts`。一次性概率遭遇也已接入公共战斗接口；道路/雾海探索与突破判定属于各自领域，未改成战斗。

筑基反馈使用 `CombatEffect` 标识识别循隙反击、固护、破核、周天贯流和传承，不再解析说明文字。标识是临时只读结果，不写入存档。动画继续消费保存成功后的结果，不决定胜负。

## 回归证据与边界

- `tests/combat-module.test.ts`：直接从公共接口创建战斗，验证只读预估、击杀、治疗/耗草、两种结算顺序、回合上限、效果标识、随机种子和序列化后重放。
- `tests/combat-characterization.test.ts` 与 `tests/fixtures/combat-before-extraction.json`：从抽取前实现取得 15 组计算指纹，覆盖三种主修、三境界、温养、转修、草药、不同气势、招式/上一招、全部筑基挑战及新旧规则、试剑榜辅修。新实现的数值与说明逐组保持一致；新增效果标识不参与旧结果指纹。
- 原有章节和表现测试继续通过实际命令验证战中恢复、预估/结算、失败恢复、重复奖励与保存后反馈。固定组合是行为保持证据，不是胜率或玩家体验证明。

全量测试与构建结果见本节后续记录。本轮没有新增 Windows 实机、Steam 或人工连续试玩证据。

### 本轮验证结果

- 开始前的整局基线在加载阶段失败：并行装备抽取当时尚未生成 `src/equipment/index.ts`，117 个测试文件无法解析依赖；没有将该轮称为通过。装备接口齐备后再验证。
- 首轮整合全量：135 文件、926 项通过。
- 最终代码（包含筑基奖励职责分离）全量：`npm test -- --maxWorkers=2`，136 文件、929 项通过，55.46 秒。测试数增加包含同工作区并行模块新增的测试，不全部归因于战斗改动。
- 单独复核此前整合中易受影响的反馈入口：combat-feedback、combat-feedback-ui、action-feedback-ui、app-combat-layout-ui、foundation-balance，共 5 文件、36 项通过。
- `npm run build` 通过，含 TypeScript 检查；仍有产物大于 500 kB 的构建警告，本次不处理资源分包。
- `git diff --check` 通过。本轮仅本地实现和验证，未提交、推送或发布；工作区其他模块并行改动保留。


## 2026-11-04 接入补全

### 章节效果协议

`ActionContext.adjustments` 接收只读的 `CombatAdjustment[]`，按阶段计算，同阶段保留输入顺序：

1. `power`：战前气势上限、伤害、护体修正。炼气应敌经验/药气/路线、外海共享准备和诸宗会准备走此阶段；说明按原位置追加。
2. `exchange`：基础招式与器物修正后的伤害/承伤调整，随后才计算境界压制、击杀和治疗。支持 `whenCorrect` 及结构化效果标识，筑基传承、战术与同行协作按原顺序输入。
3. `afterHealing`：已有规则中的末尾额外承伤。保留归潮深层未温养的历史行为，不重新计算先前治疗。

章节决定“何时生效、提供哪些数据”，战斗模块负责应用数值、夹取边界、境界压制、致命判定和治疗。`prepared` 规则保留筑基原有的基础承伤至少 1、修正后可降到 0、原主修回春判定；`standard` 保留其他战术交锋规则。这些是既有差异的显式声明，不是新增玩法。调用方不再对返回的伤害、治疗或承伤进行二次改写。

### 一次性遭遇

`world.challengeDetails` 仅将属性、功法装配、装备贡献、同行与地域投影为 `EncounterProfile`。胜率分解与上限、失败伤势由 `previewEncounter` 计算；真实挑战通过 `resolveEncounter` 结算。试剑榜和一次性遭遇共用内部纯随机函数，调用方明确写回种子。

继续使用行动前的预估；旅行中断时不扣挑战灵石、不掷骰，交涉成功也不掷骰。旅行、收费、首通进度和奖励仍由原命令处理，存档形状未变。世界的遭遇类型选择仍使用其既有随机逻辑，不在读取预估时提前抽取。

### 补全回归

新增公共接口测试覆盖分阶段效果顺序、境界压制后的击杀、准备不污染基础属性、末尾承伤历史语义、一次性遭遇九项胜率与固定种子胜败。原 15 组计算指纹保持一致；定向章节回归 9 文件、98 项通过，新增接口与指纹回归 3 文件、15 项通过。最终全量结果见下。

本轮首个全量结果为 140 文件、947 项通过、4 项失败。单独复跑确认失败来自新增全局旅行界面的测试路径：赴约/登台需要确认出发并进入目的地，同伴现场需要结束抵达展示；战后测试还误选了返程地图里的同名按钮。仅更新两份 UI 测试的正常操作与选择器，未改旅行规则。战报先完成并关闭，再进入返程目的地，额外断言这些表现操作不增加保存次数。修正后 `action-feedback-ui`、`opening-ui` 共 37 项通过。

最终复验：`npm test -- --maxWorkers=2` 为 140 文件、951 项全部通过（55.88 秒）；`npm run build` 通过，保留构建工具的大包体积提示；`git diff --check` 通过。这是当前共享工作区的自动化验证，不替代 Windows/Steam 或真人试玩验收。本轮未提交、未推送。

## 公共接口防御与依赖边界（2026-11-04）

公共接口对非法数值抛出 `RangeError`：拒绝非有限数值、负的基础战力或结算量、空/未知招式序列、非法回合上限和结算策略，以及超出 uint32 范围或非整数的种子。种子 0 沿用原生成器回退为 1 的行为。战术接口未知动作仍返回 `null`，兼容现有调用约定；合法的负向装备/章节效果修正继续允许。校验不修改调用方状态，也不消耗随机数。

`combat-validation.test.ts` 覆盖拒绝异常输入、输入不变、合法负向修正和种子边界。`combat-boundaries.test.ts` 使用 TypeScript AST 扫描源文件及 Vue 脚本的 import/export/require：纯引擎只可依赖模块内部实现，不能引用游戏状态适配器；外部调用方只可通过 `combat` / `combat/index` 或 `combat/game` 入口访问。该检查用于阻止依赖越界，不宣称能自动识别任意手写的重复战斗公式。

本次验证：新增异常输入/依赖边界 2 文件 8 项通过，原战斗接口/指纹/遭遇 3 文件 15 项通过；当前共享工作区全量 `npm test -- --maxWorkers=2` 为 144 文件、982 项全部通过（56.14 秒）。`npm run build`、`git diff --check` 通过；构建仍提示部分包超过 500 kB。全量包含其他并行模块的测试，未新增人工试玩证据，未提交或推送。
