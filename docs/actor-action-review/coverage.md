# 现有行动表现接入清单

2026-11-06 收尾。范围是现有移动、交锋及动作演出的播放与生命周期；不是增加动作素材、自由行走 NPC，也不是将规则命令抽成新引擎。

| 入口 | 接入方式 | 保留的场景职责 |
| --- | --- | --- |
| OpeningScene / Phaser renderer | motion + playback + environment | 障碍寻路、透视、保存快照差异 |
| useSceneApproach 的全部调用方 | motion + frame-clock + environment | 场景脚点、抵达后打开交互、人物朝向 |
| PathTraveler / 两类旅行地图 | frame-clock + environment | 路线几何、旅途视觉进度、暂停/恢复 |
| 公共 CombatField / 离照 | combat sequence + playback | 同一战斗下一回合判断、净伤害、敌人身份 |
| 青嶂 RoadWorld / 雾海 MistWorld | useActorPlayback | 保存后的路线、器物与环境结果 |
| QiWorld | useActorPlayback | 取材/炼化等已有动作帧与时长 |
| FoundationWorld | useActorPlayback | 人物在场、取法/补给等已有分段帧 |
| GoldenWorld | useActorPlayback | 取宝/温养/突破三段、减少动态时静态回执 |
| FriendJourneyScene 测记 | useActorPlayback | 真实已保存探望及明确重看 |
| 重逢 / 结契 | useSceneApproach | 人物/器物目标及已保存礼成投影 |
| TribulationWorld | useActorPlayback | 接收各境界提供的真实雷劫投影 |
| NascentPracticeWorld | useActorPlayback | 已保存试印回合/行功阶段；读档只显示当前状态 |
| 旧 Expedition BattleStage | useActorPlayback | 下一招或终局后播放，读档不重演旧招式 |
| FirstPractice | useActorPlayback + actorAppearance | 明确标注的无成本试演，操作不结算游戏 |
| CombatFeedback / SocialPanel | useActorPlayback | 气势条、飘字、已结算战报与战术提示 |
| ActionFeedback / SceneArrival / App 修行短反馈 | useActorPlayback | 结果确认、焦点返回、抵达提示；跳过演出不跳过确认 |

## 共享接口

- `createFrameClock` 负责一个 RAF 任务、停止、卸载与过期回调隔离；场内移动与大地图旅行使用同一个时钟实现。Phaser 仍以自身 update(delta) 驱动纯运动控制器。
- `useActorPlayback` 提供当前 frame、play、stop 及 hidden/reduced 只读用途状态。可为减少动态提供静态帧（例如金丹结果提示），默认不播放动作。
- 可选 onEnd 只处理表现收尾，不能放入领域命令。完成、替换、跳过、卸载分别区分；回执不得在卸载时再抢焦点。
- 环境监听在 Vue 挂载后安装、卸载时移除；静态/无浏览器渲染不读取不存在的 document，不启动动画时钟。
- 大地图同坐标的新数组不算新路线；完成通知在同一视觉行程内至多一次。后台不累计离线帧时间。

## 保留在本职责内的机制

最终源码搜索仍能看到以下计时，它们不属于人物行动编排，不应合并进动作播放器：

- `session/automatic-clock.ts`：自动修行的命令调度。
- `local-music.ts`、App 的 breakthroughTimer：音乐播放与突破配乐时限。
- App 的 receiptTimer：非阻塞通知的停留时长；展开后的结果确认仍由玩家控制。
- OpeningScene 的 resizeTimer：画布尺寸变化防抖。
- 文件导出组件的 URL.revokeObjectURL 延迟回收。

纯 CSS 的常驻风、云、呼吸和页面入场仍作为环境/界面效果，保留减少动态规则；已经移除以旧战报的 effect/turn 在挂载时自动重播招式的做法。NarrativeStage 的隐藏页面处理负责关闭现场交互，不负责推进角色动作。

## 证据

- 自动化覆盖：旧 RAF 晚到、抵达接续、替换序列、Escape、后台、减少动态、卸载、静态渲染、正常结束、旅行暂停/换路及重复抵达。
- `completion.html` / `completion.ts` 是开发用固定投影页面，不读取或写入玩家存档。实际浏览器验证：雷劫 Escape 立即停止；回执 Escape 后仍保留“知晓结果”；旅行暂停及两次直接抵达只通知一次。
- 浏览器发现并修复父界面重绘生成同坐标数组时重复抵达的问题；截图 `travel-finished-once.png`。回执证据 `receipt-skipped.png`。
- 各批回归的最终计数见 README。隔离组件验证不替代正常新档连续试玩、全部动作美术、Windows/Steam 或陌生玩家验收。
