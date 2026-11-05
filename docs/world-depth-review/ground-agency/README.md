# 护阵现场模块（2026-11-05）

本聊天只新增 `src/golden-story/practices/ground/` 与两个专属测试，未修改共享规则、场景、版本或迁移。主聊天尚须接入后进行整体验证；此记录不是已接入游戏、真实浏览器或正常新档连续验收。

## 现场与可行结果

初试药架已在内圈，普通路线收阵后验潮即可完成短示范。续试药架位于外沿，通道有浮木，现场变化不靠重复增加供灵。

- 集中护药：内圈护阵、将药架收入内圈、验潮。回流口可以始终关闭，结果为 `sheltered`。
- 转移药架：导回流入外渠、沿通道布外护、移开浮木、搬到高台、验潮。布置先后自由，结果为 `transferred`。
- 分念诀已研修：`game.spirit.manual === 'learned'` 允许同时护药架和通道。清开浮木后，无须打开回流口也能在外场回潮中转移；改变实际护持范围，不只是减去一次操作。

所有操作均零物资、零月，不读取时钟或随机数。验潮失手只将练习药标成受潮，晾架恢复后继续，阵石、回流口、药架位置保留。普通恢复不需要任何技能或库存。不可搬运、重复布置、干燥时晾架、非法动作及已完成操作均返回错误，返回成本为零。没有新增实际奖励、伤势或晋升门槛。

目标与可观察现象常驻；具体对象可点击或键盘聚焦，选中后只展示其局部动作。没有常驻解法步骤，测试用 `solution` 不参与运行判断。护持区域、回流路径、浮木、药架位置直接由持久状态绘制；没有实时倒计时、动画回调或直接状态修改。

## 接入契约

`index.ts` 导出 `PracticeState`（`topic:'ground'; schema:2`）、`fresh(step)`、`valid(x)`、`upgrade(old,step)`、`choices`、`quote(game,move)`、`view({step,material})`、`solution(step)`。所有动作带 `ground-` 前缀，主聊天须并入 `TeachingMove`。

`quote` 从 `game.goldenStory.practice` 读取 step/material，返回 `{error,herbs,next,failed,passed,note}`，不修改传入 State。需要命令层校验游戏资格、事件/死亡/忙碌锁，提交 next、增加失手次数、处理 step 0→1 和最终领悟。`outcome` 为局部一次性完成标志，不能重复通过。主聊天须在通过初试后以 `fresh(1)` 建立新现场。

`PracticeScene.vue` 接受 `{game:State,busy:boolean}`，仅发 `move:[string]`。根节点含 `pointer-events:auto`，适于 NarrativeStage 的 world 插槽；父组件负责绝对位置、人像及右侧面板避让。组件自身为最大宽 650px 的局部试具区，不复制背景人物或全屏覆盖。组件通过同一报价禁用动作并展示原因；观察选中是本地 UI 状态，不进存档。

## 保存与升级

v2 保存 guard、outlet、rack、debris、soaked、outcome。校验拒绝未知 schema、缺项和不可能的已完成结果。合法 v2 原样复制（不共享引用）。旧 ground 保留 outlet 与 inner/outer 护阵；旧供灵已经备足（supply=2）映射为通道已清理的准备成果，其余从当前 step 的新现场开始。旧供灵数不再作为完成条件；升级始终 `outcome:'pending'`，不补过关、不发奖励、不改变上层步骤或错误数。

版本分流由主聊天的 v58 迁移负责：未知未来版本/损坏当前数据应在调用 upgrade 前拒绝，不能拿 upgrade 的默认初始化作为修复任意坏档的方法。旧字段只有旧版迁移路径才应传入 upgrade。

## 验证与范围

- `npx vitest run tests/ground-practice-domain.test.ts tests/ground-practice-scene.test.ts --maxWorkers=2`：2 文件 9 项通过。
- 规则测试覆盖两阶段、两种普通结果、分念闭口转移、报价纯净、失手读档恢复、无效动作与重结拒绝、保守升级；192 种合法进行中组合均可普通零物资恢复。
- 组件测试覆盖具体对象→局部动作→命令回传→保存状态展示，JSON 重载、忙碌禁用与只读观察。
- `npx vue-tsc --noEmit` 此时未通过：共享 GoldenStoryScene 的 string→TeachingMove、material-practice 的可选 material 参数，以及旧 material-practice 测试的 flow/layers/supply 字段仍待主聊天同步。报错未涉及本目录或本次两个专属测试，未越界修改。
- 尚未验证父级真实布局、1280×720/1920×1080 浏览器截图、完整存档校验和公共命令集成；未跑全量 npm test/build，不宣称整工作区绿色。
- 不提交、不推送，不修改其他聊天文件。
