# 2026-11-04 完整金丹期并行实施

用户明确今天完成整个金丹期，授权独立session同步实施。完成线为G1–G8及元婴初成、可选择大典和首次能力兑现；后续元婴长期成长/灵界未扩展。本地共享工作区，不提交推送，不覆盖前轮炼气筑基及其他聊天改动。

## 所有权

- A：G1–G5及伙伴消息。独占 `src/golden-story/**`（状态/规则/UI/配置）、`src/golden-core/GoldenCorePanel.vue`、`src/outer-sea/OuterSeaPanel.vue`、`src/conclave/ConclavePanel.vue`，专项 tests/golden-story*.ts，docs/golden-completion/story/，public/art/world-story/golden/（仅潮堤与问法背景）。不改原三个领域rules/state；需要折扣/门槛接口写integration.md父线程执行。
- B：G6–G7离照和伏潮湾。独占 `src/lizhao/**` 状态/规则/战斗/现场，专项 tests/lizhao*.ts、tools/lizhao-*，docs/golden-completion/lizhao/，public/art/world-story/lizhao/。规则必须支持准备、真实挑战、取材、失败恢复、有限恩怨，不能用点击对白代替通关。地图和旅行契约先给父线程。
- C：G8圆满问心、可选仪式、化婴丹/灵地/护持/凝婴、出关/大典和首次能力兑现。独占 `src/nascent-soul/**`及 tests/nascent*.ts、tools/nascent-*、docs/golden-completion/nascent/。不要直接改世界realm类型、save迁移或公共成长模块；给父线程契约。完成元婴后有明确可玩收束，不开放无限打坐或假入口。
- 父线程：world/chapter/core与共享规则、成长/经济/装备/兼容投影、存档版本v39及迁移、地图/旅行、场景路由/App、通用checkpoint与测试、整体验证和文档。

## 协议

各域导出fresh/validator/quote/run和activity查询，独立领域字段以 `State.goldenStory / lizhao / nascentSoul` 暂定；**先写integration.md说明具体导出，父线程尽快加类型/初始化/命令**。新命令分别 `{type:'goldenStory'|'lizhao'|'nascentSoul',action:...}`。规则只导入State类型，不能Vue/浏览器，UI只发命令，保存后播放。

父线程提供realm=3、金丹圆满stage=3及1200上限（具体门槛使用C只读查询）；元婴总寿元1000年基准（旧减寿保留，成功增加500年），元婴初成仅首次能力兑现与大典，不进入后续境界循环。数值属于本轮设定，需记录与测试，不宣称既定事实。

B/C先对齐：离照首次通关给可再取得的定性辅药、丹方验证、已开道路；C炼丹必须消耗主药与辅药，每次失败后可经B已开渠道有成本补药，无永久缺唯一物品。C依赖B完成事实；请契约写明资源字段及补取条件，不互相写对方模块。C给出纯查询供B规则调用或由父线程桥接，避免循环导入。

A问法必须有非冠军/未入宗来源；C不能因错过某段对话永久锁死凝婴。原归潮法门/定神珠/灵髓不没收。元婴保留所有低境界历史字段，父线程修改旧校验。境界升后不能重新领取旧奖励。

素材复用已存在的环境，缺人物图用具名标记，不拿妖兽替代人族；候选生成不等于接入。先读相关剧情/场景/时间/成长约束。范围完整实现与领域验证后汇报，不以共享文件限制结束为空设计。共用文件改动片段写integration.md给父线程，不自行跨范围编辑。
