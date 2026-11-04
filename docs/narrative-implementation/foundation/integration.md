# 筑基接入契约（实施中，2026-11-04）

所有新增持久字段归 secretPact。请主聊天先按以下稳定接口接入；本聊天不编辑共用文件。

- `secret-pact/state.ts` 导出 `pactTrialComplete(p: SecretPact | undefined): boolean`，只读 `p.trial === 'complete'`，不会依赖 foundation 或 progression，供 caps/retreat 窄上下文扩为 `{foundationJourney, secretPact?}`。缺失字段不视为完成。后期 400 门槛须同时 refined + complete；不要把 won/pactRival 或 manual 当完成。
- 新状态 `trial: 'none'|'crossing'|'division'|'escape'|'stabilize'|'complete'`；`hazard: {hp,progress,turn}|null`；`site:'away'|'zhaoxuan'|'brokenStele'`；`pursuit:'none'|'pending'|'notified'|'closed'`；`pursuitPrepared:boolean`；身份/观察/家书放 `story` 子对象。`freshSecretPact` 初始化；提供 `upgradeSecretPact` 仅补缺失默认，不补经历/奖励，由版本迁移调用。
- `pactActivity(p)`：trial crossing/division/escape/stabilize 或 hazard 非空；对外操作、旅行等需互斥，但放行 secretPact 自身动作、pactRival 战斗与治疗恢复出口。不要在 workshopLock 中锁 pactActivity 后让 pactQuote 自锁；pactQuote 将使用自己的基础全局锁。
- 地图新增照玄遗府（古道支脉 80 里）和断碑驿（建议听雨旅亭—古道之间安全交接点）。不要扩 foundationJourney.location 枚举，抵达时保留既有父地点、调用 `arrivePactSite(s, site)`；出发去其他地区清 `secretPact.site='away'`。该函数只更新现场不收费，旅行由主聊天结算。
- `pactDestinationError(s, site)` 提供资格：照玄需中期、离渡完成、三路任一取材胜利、已约定；不要求古道主材。断碑驿需 notified 且无救援危机。入口显示于三路线取材后的地图；promise 可在无名渡或已取材安全地点补约。到达不是自动完成挑战。
- 既有 enterAnchor/enterLight 为抵达后的准备+共同行险（一月，草 2/0），不再承担地图旅行；现场接分宝和逆流通路挑战。断碑驿无需隐藏期限。
- 新版 `validSecretPact` 应以新增字段为必需；旧版校验需 legacy 参数，迁移再调用 upgradeSecretPact。存档版本由主聊天统一。

完成查询、状态字段与旅行函数将在本目录交付说明中标记验证结果。新增文件/接口尚在实施，暂勿称验收。

已收到地图补充：最终仍采用上文 `secretPact.site` 模型，避免扩大 Destination 后牵动六地 Record、剧情投影、所有场景对象映射。请地图将 pact/stele 作为独立章节目的地，使用 `pactDestinationError` / `arrivePactSite`（site 参数 zhaoxuan/brokenStele）。父地点可保持出发的 estate/snow/inn/frontier；无需先到 frontier。该模型只存现场，并由主聊天在离开时清 away，勿双写 foundationJourney.location 成非六地值。

恢复契约已调整：`pactActivity` 仅在现场 hazard 非空或 division 分宝未定时锁外部操作。失败/撤退后 hazard=null，保留 crossing/escape/stabilize，允许就地静养和地图离开。`exitSite` 仅退到当前地点安全石台，不改 site，绝不回写远处父地点造成瞬移。重返照玄支持 inside/crossing 继续 retryFlow；所有离开仍由旅行引擎负责。FoundationPanel 已适配 TravelDestination。

**整合必修**：world.ts pactActivity 分支须放行 `foundationJourney` 的 `{kind:'battle',battle:'pactRival'}`，否则 division/betrayed 下无法开战；目前只放行 move/withdraw 会锁死争宝。放行开战仍由 pactFightError 检验 site 与 trial。另 hazard=null 的待完成 phases 允许 rest/装备/地图，实际 hazard 或 division 才互斥。

专项旧测试第一轮 13/13 在 tools/mist-checkpoint.ts 的炼气 enter:medicine/sword 前置失败（新药窟门槛已生效，旧 checkpoint 未更新），尚未运行到照玄。请主聊天统一更新该共享工具的新档路线。筑基聊天继续补独立领域矩阵，随后重跑真实命令链专项。

UI 已使用 TravelMap 预览 pact/stele（后者由 Map 发 wayfaring visit），并依 site 显示照玄/断碑背景。F1/F2/F5/F6 的一次性记录在 secretPact.story，通过同一专用面板的现场对象调用命令。FoundationPanel 热点现在按地点称“师门与家书／旧刻与同道／外宗与照玄”。
共享 tools/secret-pact-checkpoint.ts 也需更新：中期取材后先 wayfaring visit zhaoxuan，再 enterAnchor，随后 guardFlow/readFlow/breakFlow 才到 division。旧 checkpoint 无旅行且只 enter，会停在门外或 crossing，相关 UI 用例无法得到旧的分宝现场。

已新增 `tests/foundation-pact-policy.ts`，集中真实命令完成路径（promise → visit → enterLight → guard/read/break → yield → guard/read/break），三路线×三功法主线测试已调用。**共享 tools/foundation-journey-checkpoint.ts 的 completed 分支须在 routeProcess 后插入同一路径**，否则所有 journeyCheckpoint(...,true) 卡 399。该工具属于共享范围，本聊天未编辑。最新照玄专项 4/13 通过，余 9 项现在明确卡在 world.ts 尚未放行 pactRival 开战。

15:29 收到主聊天明确移交 tools/foundation-journey-checkpoint.ts，已实现：cultivate(target>=400) 在 refined 后调用 tools/foundation-pact-policy.ts 公共命令路径完成照玄并旅行返回原地。没有直接写状态补完成；原 tests helper 复用该统一策略。special site 返回父节点的资格行由主聊天修复，本聊天不覆盖。

42 项专项已通过（secret-pact、foundation-growth-mainline、foundation-narrative-revision）。为修复专用 UI fixture，也已更新 tools/secret-pact-checkpoint.ts：真实 travel + 三步入府，不写状态。基础和新专用测试共享真实命令策略，未更动主聊天的地图/迁移文件。

65 项（7 文件）专项与邻接 UI 已通过，typecheck 上轮已通过；最终复核进行中。请主聊天注意新版迁移 upgradeSecretPact：旧 inside→crossing、betrayed→division、resolved→stabilize/escape，仅安排尚需亲历的通路，不补 trial complete 或奖励，避免旧现场无动作。已完成的新档保持所有事实。

15:37 按主聊天移交修复 female covenant 与 substitute-playtest：把实际照玄历练前移到 routeProcess 后、古道 report 前。同步修正规则：report 尚未开始时要求照玄完成，避免女性旧入口在 240 提前触发救援后，被“救援中不赴照玄”和新 399 上限夹成死锁。既有救援进行中不插入追索；无需改变战斗或测试断言。

15:39 收到最终地图位置约定：主聊天抵达照玄会将 foundationJourney.location 置 frontier，断碑置 inn，同时保留 secretPact.site 区分真实现场；返回原地由测试策略出发前捕获 origin 并正常旅行实现。此条覆盖前文“保留出发父地点”的早期建议。普通 foundationJourney 远程操作由 world.ts 拦截，只放行 travel/pactRival/move/withdraw。已将专项的取材处理/榜单战斗显式旅行返回后再执行。

本轮修复后 foundation-late、substitute-playtest、secret-pact、foundation-growth-mainline 共49项通过。新增女性救援门槛拒绝/完成后放行测试，防止照玄与救援互锁。

## 交付完成

16:12 追加现场交付：F1/F2/F5/F6 已由 FoundationPanel 的本地有名对象直接打开，详见 README 最新段落。新增只读 local-story.ts，不需要公共地图/全局版本接线。四个公共命令生成的独立检查点在 5296 真实浏览器完成点击与结算，四张 1280×720 证据在本目录；未访问 5334。10 文件 96 项通过及 typecheck/diff 检查通过。外海失败交其负责域，主聊天统一最终全量/构建。以下 15:38 为历史批次结果。

15:38 最新共享状态下 9 文件 87 项通过，typecheck、diff --check 通过。本域停止新增改动，可进入主聊天统一全量/构建/实际 UI 验收。完整成本、F1–F6 行为和边界见 README.md。主聊天已有地图/caps/v38/dispatch 改动，本域没有遗留必须由本聊天完成的接口空壳；仍需主聊天以全量结果确认跨域兼容。
