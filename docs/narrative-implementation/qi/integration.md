# 炼气接入契约（领域已交付，共用整合中，2026-11-04）

所有新增状态位于 `qiJourney.narrative: QiNarrative`，由 `src/qi-journey/narrative-state.ts` 导出 freshQiNarrative / validQiNarrative。主聊天迁移仅补 fresh，不造经历。validQiJourney 将追加第三参数 narrativeRequired=false；新版调用请传 true，历史校验保持原调用。

查询 `src/qi-journey/narrative.ts`：`qiCaveComplete(s)`＝药窟准备/胜利/处置后真实应用已成；`qiNarrativeActive(s)`＝location 非 home；`qiNarrativeBattle(s)`＝duel 非空。主聊天请把 active 加入通用行动、闭关、突破、跨领域活动互斥，自己的 qiJourney 命令除外；并在凝元/突破门槛检查 complete（领域 enter/refine 也硬拦）。战中/入窟不许其他活动推进时间。

命令仍 `{type:'qiJourney',action}`：`cave:depart`（山下→石涧，1月，含120里行路/勘路），`cave:return`（石涧→山下，0月，撤离包含在入窟成本），`ambush:depart`（山下→青嶂支路，1月，含90里行路/布防），`ambush:return`（支路→山下，0月）。导出 qiNarrativeDestinations 和 qiNarrativeTravel(s) 供章节地图投影。请接上述命令到 story-routes，沿既有命令收费，不额外叠扣。

专用 UI `QiNarrativeScene.vue` 会由 QiJourneyPanel 在 active 时呈现；山下“药坪与药窟”热点有出发入口。开篇动机组件直接接 OpeningScene；山门/家书回应也在炼气专用热点。若全局 router 只按 q.node 判断活动，需要加入 qiNarrativeActive 优先显示 QiJourneyPanel。主聊天请检查 activity 查询及死亡清场；死亡时 narrative.location='home', duel=null，phase 战斗若是 challenge 则置 prepared。

额外夺札才出现段厉风险；同意分抄或放弃额外札记没有追兵。让出额外札记/结伴正路/击退/擒送均有限结局，无强迫杀人分支。

测试适配：现有 tools/foundation-playthrough.ts 的自动策略在 gates===1 且 !qiCaveComplete 时应先跑本模块导出的 `qiNarrativeNext(s)`（真实命令，非编辑状态），主聊天拥有通用脚本请接入。否则旧模拟会停在新增门槛；不将此误报成新版可达性失败。

## 已落地补充

- `qiNarrativeLocation(s)` 返回 home/cave/branch；`qiNarrativeTravel` 返回 action/from/to/distance/months/settlement/error，ready/锁定由报价决定。
- 药坪是山下同一安全据点的近景，无新持久位置/跨地区收费。场景 ID qi-medicine-court、qi-stone-ravine、qi-pass-branch。
- cave:depart 在淬脉后立即开放，不先要求240修为或第二轮准备。原第二轮三路准备仍是凝元内府前置，不能跳过；药窟可先做也可后做。
- apply 消耗灵草2/1月，亲手处理药液逆流调息、伤势至多减1，后续内府 qiPower armor +1；固定成果无额外金钱修为大奖。一般一趟2月；护体另灵石4，药理另灵草2，辨阵须神识8/心得2但不消耗。
- 暂定 `qiNarrativeNext` 在第二轮准备完成后提供真实行动序列（不改状态）；调用方需处理其报价 error（缺草时补草、伤重疗伤）。**必须在已完成药窟但仍处 cave 时也调用，否则遗漏 notes/return。** 建议只判断 gates===1 再调用，不以 !complete 过滤；helper 内部会在 home+applied 返回null。
- 新版 validQiJourney 中 active 禁止 pending，因此 apply 遇来信会退回home保留processed，处理来信后重走已含返程的行程；不扣材料、不暗中完成。
- 17项领域专项已过，包括真实命令新档至筑基、药窟战中 validState/保存读取、三主修×三解法、胜负/撤离/复用准备/四种截夺收束。全局整合和UI证据待继续。

父线程提醒后的专项修正：测试第三主修已更正为真实 breath（归元息），去掉未用导入，typecheck通过。helper 对active药窟的缺草apply或伤重challenge会给 cave:return；home缺草/伤重返回null让原恢复策略补给疗伤，不会在药窟锁内反复发非法命令。17领域+1UI专项通过，扩测旧炼气测试发现3个旧假设，正在改为新门槛/动态SAVE_VERSION。

## 2026-11-04 15:32 当前交付

- 8个炼气测试文件65项通过（含原qi preparation/scene/performance/movement）；新增17领域+1实际DOM组件路径。
- 父线程追加的 balance-recovery 已诊断：gift样本测试先 `.map` 256条完整人生再 `.find` 一个失败样本，复跑稳定约5170ms触发5000ms上限，无非法命令/卡死。改为逐种子查找并找到即停，保留前一项完整128×2矩阵；与balance-review一起13项通过（总5.44秒）。balance-review无炼气缺陷，不作改动。
- 浏览器1280×720隔离组件已真实点选：第137月药坪→138月石涧→互守退路→辨阵准备→留退路→四合（辨/守/击/辨）→分离药性→139月花灵草2实际应用→分抄札记→回山→刷新，显示“药窟行程已结”。截图在 evidence/。起点由真实命令生成，不是完整新档手动UI；保存是验收页独立sessionStorage，不代表正式App IndexedDB验收。
- 页面 source `preview.html/preview.ts` 供复验；不读写玩家存档。完整App场景入口、地图路线、存档迁移、全量回归由父线程整合后验收。

最终补齐札记实效（15:36）：`qiNotesPower(s)` 用真实分配史给下一次凝元内府伤害+1（分抄）/+2（独占），留下为0；交札止争后独占加成归0，核心药法护甲+1保留。选择前UI明示；不发额外金钱、修为或装备。专项新增对应实效/撤销回归；不会改父线程共享接口。炼气领域代码已收束。

最终复跑：typecheck通过；6文件62项（qi-narrative19+UI1、qi-journey、qi-preparation、balance-recovery、balance-review）通过，git diff --check通过。另4个原UI/scene/performance/movement文件此前18项通过。未提交推送。README列成本、证据及未验证范围。
