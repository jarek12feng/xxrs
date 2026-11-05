# 分药试具独立交付（2026-11-05）

本批仅新增分药目录、专属测试与本文。没有编辑共享规则、存档迁移、问法动作类型或宿主场景；未提交、未推送。共享接入与全量验证由主聊天统一完成。

## 现场与手法

初试是一盏单股药息的简短示范：温盏、侧孔排浊、收取。温盏一次即改变浮浊位置，拒绝重复温盏，没有分层计数。续试换成互相牵引的青金双息，直接排浊会混流，不再重复一遍初试操作来凑批数。

- 普通手法：把一股引入旁盏暂存，主盏余下一股再排浊；不需法门、灵草或其他资源。
- 分念手法：已研修分念诀时，可让两股始终留在主盏，由双念分别照看。旁盏保持空置，保存状态和图形不同；不是减少同一套操作的点击。
- 灵草：仅混流时可用，耗2灵草，清除混流而保留旁盏/分念与已分离状态。不混流、已收取或余额不足时返回零扣费错误。它不能代替正常温盏排浊。
- 免费恢复：合盏凉置重置当前试料，无实际药材、年月、伤势损失；收取失败不销毁试料。所有合法未收取局部组合都能恢复。

默认只显示阶段目标、当前器物现象和操作后的因果结果，不常驻解法清单。主盏、旁盏、侧孔、净药瓶、灵草各自可鼠标/键盘选择，选择后只显示该器物动作。动作报价与禁用读取同一纯域。SVG根据保存状态表现浮浊、双息位置和温意，不由动画判断成功。

## 接口

`src/golden-story/practices/pill/index.ts` 导出：

- `PracticeState`：固定 `topic:'pill', schema:2`；`warm`、`haze`、`breath`、`muddled`、`collected`。
- `fresh(step)`、`valid(x)`、`upgrade(old,step)`。
- `choices` 数组、`quote(s:State,move:string)`、`view({step,material})`、`solution(step)`。
- `quote`从 `s.goldenStory.practice` 读取本轮，不写宿主状态。返回 `{error, herbs, next, failed, passed, note}`。普通动作零月；宿主负责原子扣灵草、保存 `next`、计错误和推进初试/续试。只有成功 `pillCollect` 返回 passed，重复收取拒绝。

需扩展 `TeachingMove`：`pillWarm | pillHold | pillSplit | pillVent | pillHerb | pillReset | pillCollect`。不依赖旧通用 `confirm` 动作；宿主必须按报价 `passed/failed` 判定，不能只检查动作名。

`PracticeScene.vue` 接 `{game:State,busy:boolean}`，发 `move:[string]`；根元素 `pointer-events:auto`，宽度 `min(680px,100%)`，无全屏背景与人像。宿主在 `NarrativeStage #world` 内决定绝对位置和避让。未收到宿主保存后新 props 时，图形保持旧状态；仅器物选择属于本地 UI 状态。

## 保存与升级

当前 schema 2原样复制；非法或未来 schema 拒绝，不能静默重置。旧 `{topic:'pill', layers, clear}` 升级：已温盏（layers 1/2）保留为浮浊已升起；已有一批净化在续试中保留为旁盏分离；当前阶段已完成的净化保留为 `haze:'clear'`。所有旧阶段仍 `collected:false`，由真实收取推进，不补领悟或奖励。阶段、来源、累计错误由共享迁移保留。升级不改变共享存档版本，主聊天接入v58。

## 验证与边界

专属测试：`npx vitest run tests/pill-practice-domain.test.ts tests/pill-practice-scene.test.ts --maxWorkers=2`，2文件9项通过。覆盖两阶段普通路径、分念路径、失败恢复、72个阶段/局部状态组合恢复、无效付费防护、报价纯净、重复收取拒绝、保存升级、对象点击与宿主写回、busy禁用、补救价格与命令。

运行全工作区 `vue-tsc --noEmit` 时，共享整合尚在进行：报错位于 `GoldenStoryScene.vue` 动作类型、`material-practice.ts` optional material 接口、旧 `material-practice.test.ts` 对旧字段的构造；分药目录与两份专属测试无类型诊断。本模块 scoped diff 检查通过；尚未完成共享全量回归、构建、真实浏览器1280×720/1920×1080布局验证或正常新档连续验收。组件测试不能替代这些验收。
