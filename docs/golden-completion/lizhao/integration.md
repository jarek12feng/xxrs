# B 离照 / 伏潮湾接入契约

2026-11-04：实施中，父线程请据此接共享文件；本文件随实现更新。

- `State.lizhao: Lizhao`，`freshLizhao()` / `validLizhao(s)` 由 `src/lizhao/state.ts` 导出。
- `LizhaoAction`、`lizhaoQuote(s,a)`、`runLizhao(input,a,id,tick)`、`lizhaoActivity(s)`、`lizhaoGoal(s)` 由 `src/lizhao/rules.ts` 导出。命令 `{type:'lizhao',action}`；run 自身月结算沿用 tick 和 advanceMonths。quote 返回 months/stones/herbs/error。
- `LizhaoPanel.vue` 接 `game,busy`，emit `act: Intent`。单主场景 NarrativeStage，规则驱动地点，无直接 UI 位置赋值。
- location 为 `away | harbor | outer | inner | chamber | bay`。away 不占用现场；其他地点为离照域。`lizhaoActivity(s)` 返回 boolean（非away），duel 单独可读用于阻止其他动作。入口动作 `visit` 只允许金丹后期（realm=2 / conclave.stage>=2）、已在外海古渡（outerSea.location=ferry）且 conclave.location=away。`leave` 从 harbor 返回古渡并设 away。外/内/丹室是同一洞天内步行，不扣旅行年月；挑战和研修各按 quote 消耗。
- 旅行：父线程将 `visit` / `leave` 映射真实离照往返路线；在未接 passage 前暂按往返各 6 月由规则结算。其他 `enter` / `deeper` / `chamber` / `return` 都是洞天局部移动；伏潮湾应对是有预告的选择，不自动中断其他域。父线程接 passage 后请告知或直接将所需改动写此文件，避免双扣。
- C 依赖固定：`cleared: boolean`（内层真实取材胜利）、`recipeVerified: boolean`（丹室互验）、`reagent: number`（定性辅药份数，可由 C 炼丹消耗）。首通给2份，验证不消耗该份数；C每炉需耗1份。B校验允许0份，不用大于0推断完成。
- 补药：仅 cleared + recipeVerified 后 harbor 可 `resupply`，每次1份，6月/灵石24/灵草4；不要求和平分配或韩砺舟存活。补药不会重领首通奖励，不重开追索。容量20，按缺口购买；C请自行检查库存与每炉扣药。
- 新状态关键项：route `none|cooperate|independent`，preparation `none|ward|purify`，outerCleared、cleared、recipeVerified、reagent，allocation `none|share|private|seize`，pursuit `none|rumor|warned|confront|defeated|repelled|settled|exposed|killed|bypassed`。只有明确选择 seize 才产生 rumor；正常共享或保留独立所得无追兵。
- 主线门槛建议 C 使用 cleared && recipeVerified，不强迫完成条件追索、恋爱、杀人。跨域活动互斥由父线程统一接入，B也会拒绝现有战斗/旅行/突破中的操作。
- 元婴后保留领域历史，不能重打/重领奖。validLizhao 支持 realm>=2 的历史，无重置。

本域不修改 world、地图、存档、公共场景路由，也不提交推送。

## 15:59 接入进展

- 已改用父线程扩展的 `lizhao:visit/leave` passage（passageMonths/error/advancePassage），途中事件保存余程；已有专项中断恢复测试。
- 实际字段/API与上述合同一致。`view.ts` 提供场内对象分组；`combat.ts` 的交换预览与结算共用。`LizhaoPanel.vue` 已存在。
- 规则范围内首次23项+1组件测试；正在补三主修公共dispatch/migrateSave回归。fixture Path 已修正为 wood，fixture明确只是隔离场景。
- 分配最终规则：正常share/private不产生追索；seize明示扣下药商邵荃已预订的余药，额外得1份并产生rumor。此后公共补药为32石（原24+额外接应8）；settled/exposed后恢复24石。killed/repelled/bypassed不恢复私人合作但公共渠道仍可用。每次仍6月4草。
- 背景已实际查看1920×1080候选并复制 `public/art/world-story/lizhao/chamber.webp`。旧丹室使用该图，外/内/港湾复用已有外海背景；韩砺舟为具名人族标记，未以妖兽代人。

## 16:00 公共检查点观察（父线程所有权）

`tools/conclave-checkpoint.ts` 的第二层外海准备先work(12)再herbs(6)，breath在此次运行买草后灵石不足，Rejected outerSea prepare（尚未进入离照）。请父线程统一在herbs后按seaQuote补齐stones；B未改此共用文件。B自己新增的lizhao-checkpoint已将后续会谷训练/准备在买草后补足灵石。此处失败不算离照通关证据，也不能静默跳过。

## B交付结果（16:02）

- `npx vitest run tests/lizhao.test.ts tests/lizhao-ui.test.ts tests/lizhao-integration.test.ts`：3文件29项全部通过。
- 最终三主修公共dispatch/migrateSave均通过；独立检查点`tools/lizhao-checkpoint.ts`按当前quote在买草后筹资，不依赖旧conclave-checkpoint的低资金第二层准备。
- 独行blade/purify失败已修复：调整本域内层挑战为420气势/44攻势，fixture能力数值未强化。另以实际公共命令成长战力复验三主修。外阵360/42，韩砺舟450/52。
- `git diff --check`通过。
- `npm run build`于16:01及16:02均被其他所有权正在编写的`tools/golden-completion-checkpoint.ts:19:100`阻断：`Property 'log' does not exist on type 'never'`。B没有跨所有权修改；不宣称构建通过。B自身typecheck错误（view object类型、fixture Path）已经消除。
- 资源契约、passage续程已实际接入本域；无提交、无推送、未生成新美术。完整范围与证据边界见README.md。

## 独立审计P1修复（2026-11-04 17:02）

离照固定辨影/固定守势通解已修复，不改公共状态/API/材料价格。新纯查询 `lizhaoWindow(s)` 从既有turn/effect/toxin推导可预判开口；共享战力依旧走foundationPower/tacticalPreview。三主修×合作/独行×护潮/净药：观察、辨路进攻、候潮反击三策略分别12/12两层可达，固定反击/守势/辨影分别0/12；4文件32项、typecheck、diff检查通过。原review/balance-audit证据保留，新对照为`tactics-after.json`；详见`tactics-fix-20261104.md`。未提交推送、未触碰5334用户存档。
