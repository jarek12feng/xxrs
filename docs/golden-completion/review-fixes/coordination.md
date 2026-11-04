# 三个独立修复会话协调（2026-11-04）

用户明确要求将复核问题发给新的独立session实施。共享工作区已有大量并行改动，禁止重置、覆盖他人工作或整库格式化；本轮不提交、不推送。先读AGENTS.md及其领域约束。原始review三份报告保留，修复记录分别写本目录narrative.md、experience.md、challenge.md。

## 文件所有权

新独立会话ID（local）：A `01a1a61f-eaad-7482-be1d-bf6f090d1b21`；B `01a1a61f-ecdb-77f3-a37e-11a03a18dd48`；C `01a1a61f-ef7b-7a72-85df-5a0061b6842f`。优先以本目录交接文件协调，父任务仅派发本轮修复，没有授权向外部人员发送消息。

- A 剧情文案：src/golden-story/**、src/nascent-soul/covenant.ts、CovenantScene.vue；对应专项测试。处理N4/N6/N7/N8及这些文件的自然文案。不要覆盖刚完成的问法两步亲习与结契庭院。其余领域文案写具体替换表交对应所有者。
- B 场景交互：src/lizhao/LizhaoPanel.vue、src/scene2d/NarrativeStage.vue、src/nascent-soul/NascentPanel.vue，以及新建纯表现场景组件；对应UI测试。处理V1优先、V2–V5、元婴大典和首次护渡现场；不改领域规则、view.ts或CovenantScene.vue。已有资产先查再复用，新资产使用专用review-fixes目录保留来源，不冒用剧情人物。
- C 规则挑战与语义：src/nascent-soul/rules.ts、view.ts、state.ts、thunder.ts、thunder-state.ts、contact.ts及新增纯规则模块；相关规则测试、公共命令验证工具。负责N1暂缓可继续、N3真实承诺筛选、N2凝婴固定通解及准备收益、N9本域术语。同时承接A提交的本域文案。不改NascentPanel.vue，UI需求写接口说明由B接入。

存档若确需变更仅C负责src/world.ts与src/save-version.ts，并同步版本/校验/保守迁移；优先利用已有字段，禁止凭空补经历奖励。任何越域修改先找所有者协调，不能两人同时改同文件。三个会话可互相读取本目录交接文件；通过父任务给出的ID相互联系，用户已授权针对本轮修复沟通。

## 验收

不能只交建议。先复现再修复，报告旧问题与新证据对应。已修的离照单招通解、寿限31月、同源恢复、元婴战力和新增问法/结契不应按旧报告再改回。

挑战来自机缘准备、可读局势和选择，不涨高境界费用、不堆跑腿、不暗骰暴毙，不强制恋爱。C必须重跑三主修、充分/最低合法准备、错误操作与连续失败恢复，并单列数据，不能将固定样本当玩家胜率。B用独立端口和隔离检查点，不读写用户5334存档，1920×1080与1280×720检查鼠标撤退、状态可见和代表现场。A检查既有经历和伙伴年月，不伪造在场。

每域运行必要专项测试/类型检查并提供结果。最终由C在A/B完成后做一次共享版本完整npm test -- --maxWorkers=2、npm run build、git diff --check；若其他域未完成则明确标注等待整合，不拼接局部绿灯。所有会话都须完成自身修复与记录后再报告，不声称Windows/Steam或新档连续UI验收。
