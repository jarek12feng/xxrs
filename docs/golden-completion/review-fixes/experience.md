# B：场景交互与重要现场修复

2026-11-04。本地已实施；未提交、未推送，未连接、读取或写入用户5334存档。保留共享工作区其他修改，未修改规则/view/state、GoldenStoryScene或CovenantScene。A负责问法、结契与潮堤人物；C负责挑战规则与语义。本记录只覆盖B实际修复与验证。

## 修复对照

| 原问题 | 本轮实现 | 实际证据 |
|---|---|---|
| V1 鼠标撤退、敌方状态被通用侧栏盖住 | NarrativeStage增加默认兼容的battleInspector开关；离照使用自己的CombatBar，战况并入底栏，不再渲染冗余侧栏 | retreat-before.json两尺寸四项均命中battle-inspector并点击超时；retreat-after.json四项均直接命中combat-retreat、点击后duel=null/location=harbor；scene-check另验证敌方状态命中与实际出招、撤退 |
| V2 韩砺舟/守炉敌人为文字框 | 韩砺舟新独立人族全身图；守炉傀儡复用石雕旧阵守卫三姿态；外层禁阵显示三重潮纹。主角和敌人短反馈只读turn/effect | bay-fight、lizhao-battle及move截图；真实鼠标出招一合后转场与回港。问法/潮堤由A完成，B另检查两尺寸潮堤两人物及打开图台 |
| V3 圆满/凝婴只有数值框 | 主角打坐、六印破开、同源丹火/回震/露纹征象；三段丹流/识海/成形差分；药瓶只按实际持有数量显示，服丹后显示收空；灵地与外护环、伤后静养反馈 | phase-0/1/2、preparation、trial系列截图；UI测试验证拒绝/未保存命令不切段、JSON重装保留破印 |
| V4 大典/首次护渡仍是静室 | 出关换空庭，简礼茶案与正式礼毯；按保存guests显示伙伴和轮值人员。护渡换古渡、测绘舟/乱流/护持/彼岸路标随surveyed→sheltered→done变化 | emerged/formal/simple/surveyed/sheltered/crossed两尺寸实际鼠标串联；结契由A独占，本轮不重复改 |
| V5 地点复用/固定热点错位 | 伏潮湾独立无人礁岸、离照港复用码头图台、古渡保留原图；丹室出口移至左上干廊道、炉移至右后炉体；地点分别配置热点 | chamber-furnace/chamber-exit、bay-fight截图；炉体检查使用尚未验药的公共命令检查点 |

## 与C接口接线

- NascentPanel信函仅列nascentPromises为true的事项；元婴后保留实际相识伙伴的companion入口。
- 灵地准备区用channelingSituation显示三段征象，当前行功仍使用同源征象；显示术语统一丹元/心神。
- nascentContentBoundary独立列于护渡完成面板和此地见闻，不塞进人物对白。
- 新增NascentPracticeWorld、NascentAfterWorld仅接受game，无领域写入、计时结算或奖励。读档直接重建场景。
- NarrativeStage新增focusScene开关，默认为true；仅本轮凝婴/多人礼庭/护渡现场关闭镜头放大，防止人物和反馈被裁切。其余场景行为保持原默认。

## 验证方法和结果

使用专用Vite 5386、独立Chrome无痕上下文、DPR=1、1920×1080与1280×720。实际鼠标locator.click，无force、无键盘代替撤退；Escape仅用于收起普通面板。检查点经goldenLateCheckpoint、finishGoldenCompletion、outerSeaCheckpoint及公共dispatch构造，强扣药的伏潮湾分支另经合法战斗、验药、强扣、听信和雇伴生成。未直接赋予角色境界、资源或完成标记。

- [retreat-check.mjs](experience-evidence/retreat-check.mjs)：先红后绿，四组鼠标撤退；证据[修复前](experience-evidence/retreat-before.json)、[修复后](experience-evidence/retreat-after.json)。
- [scene-check.mjs](experience-evidence/scene-check.mjs)：最终40张截图，两尺寸均验证战斗状态命中、出招/撤退、炉/出口热点、圆满、三段凝婴、准备征象、正式礼/简礼、三步护渡及潮堤人物。浏览器pageerror为空，所有场内img成功加载。状态与图片检查见[scene-results.json](experience-evidence/scene-results.json)。
- [trial-check.mjs](experience-evidence/trial-check.mjs)：补拍两尺寸丹火→回震→露纹、破三印及中止后的静养，启用减少动态效果；结果见trial-results.json。
- `npx vitest run tests/review-experience-ui.test.ts tests/lizhao-ui.test.ts tests/golden-scenes.test.ts --maxWorkers=2`：3文件11项通过。覆盖完整领域命令、拒绝时不抢播、重新装载及按保存名单显示来客。
- `npm run typecheck`与`git diff --check`通过。共享全量npm test/build由C待A/B均完成后统一执行，不以本专项结果代替最终整合。

过程中的真实问题：首次scene-check错误地在已验药且已分药检查点寻找炉体操作，正常投影已隐藏该入口，脚本超时；改用公共命令经过chamber、尚未verify的检查点重跑通过。逐图又发现通用镜头把大典左侧来客/底部反馈裁出视口、护渡终点落在面板后；关闭此现场镜头放大并调整舟/路标终点后重跑。来客名牌已移至头顶避开茶案；720高战斗脚点上移避开底栏。

## 素材和范围边界

新增四项素材已接入，原图、提示词、实际尺寸、alpha、输出散列见[素材记录](../../art-candidates/review-fixes-20261104/README.md)。实际背景为1672×941，未冒称2048原图。已有正确身份素材优先复用。

这是代表节点、真实产品组件StoryScenes的隔离浏览器验证；没有完整App HUD/IndexedDB保存失败端到端、正常新档连续成长、所有分支、Windows实机、Steam、陌生玩家或2560×1440验收。没有重走整段雷劫；已有ThunderWorld保留。两尺寸鼠标通过不代表完整逐帧演出；韩砺舟独立动作帧、轮值人员差分与专属丹瓶仍缺，当前边界见素材记录。

## 整合后补修：见闻测试定位

C首次共享全量179文件1268项中出现3项失败，focused原样重跑仍失败，位置均为`openSceneNotes`对`textContent === "此地见闻"`的精确匹配。NarrativeStage格式化使按钮文本带首尾空白，实际入口与点击逻辑仍在。B按协调修改公共测试helper：优先aria-label，否则归一化textContent空白；同时新增入口存在、未禁用、点击后真实`.narrative-notes`出现的断言，不以可选链跳过缺失按钮。

重跑`conclave-ui`、`golden-core-ui`、`outer-sea-ui`、`review-experience-ui`：4文件11项通过；`git diff --check`通过。日志见[notes-helper-retry.log](experience-evidence/notes-helper-retry.log)。最终共享全量仍由C统一重跑，不能将第一次1265/1268记为全绿。
