# C 凝婴接入合同（实施中）

- `src/nascent-soul/state.ts`: `NascentSoul`, `freshNascentSoul()`, `validNascentSoul(s)`。
- `src/nascent-soul/rules.ts`: `NascentAction`，`nascentQuote(s,a)`，`runNascent(s,a,id,tick)`，`nascentActive(s)`，`nascentGoal(s)`，`nascentCap(s)`。quote返回error/months/stones/herbs和显式settlement。
- `src/nascent-soul/view.ts`: `nascentInteractions(s)`和具名场内热点分组，父线程路由显示。
- 父线程添加State.nascentSoul、fresh初始化、保存v39及validator；command `{type:'nascentSoul', action: NascentAction}`；realm 3；Conclave.stage=3；goldenCap stage3=1200；stage2=899。
- `complete`命令在离照通关、899修为、综合试炼获胜后设置stage3/cultivation900；凝婴须1200。`nascentCap`返回stage3?1200:899，父线程用于现有金丹修炼。
- 成功凝婴设置realm3，寿元limit加6000月（保留旧减寿）；历史所有领域保留。realm3禁用普通修炼/旧突破，仅开放本域出关、大典与首次能力兑现。
- 活动互斥：nascentActive仅trial或attempt非null；所有外域命令及时间活动需阻止。领域quote会阻止外域战斗/旅行/秘境/拍卖/pending。试炼、凝婴由本域动作推进，不能借普通休息中途恢复。

## B资源合同（已按父线程指示对齐）

读取 `s.lizhao.cleared`、`recipeVerified`、`reagent`。每炉必须cleared与recipeVerified且reagent>=1；成功扣料时直接减reagent1，同时本域auxiliaryUsed记录累计耗药统计（不是库存）。B resupply补库存。没有completed/auxiliary别名。C不改其余B字段。

C主药库存`marrow`初始0，归潮depth2后`claimMarrow`首次转录1份（不改conclave.depth）；后续`renewMarrow`从归潮已开药床付24灵石/6月换1份；累计采领保存在本域。每炉耗1份主药和1份辅药。自炼需study>=4，18石/6草/6月；委托48石/6草/12月。自炼可明确选择冒进（失败）或稳火（成功），药理复核付6月后自炼更省草；无暗骰和永久失败锁。灵地独修/协作均可，护持阵法/同道均可，恋爱及入宗非必需。

## 当前关系

男性原关系以foundationJourney.bond='promised'/'covenant'为准；已有social.bonded保留。新仪式三步商议-见证-礼后，仅在已定情时可用，礼后才落盘covenant，social.bonded原定情记录保持不动。不为未定情者凭空造关系。

## 验证边界

专用tests覆盖真实领域命令、资源、三段失败恢复、三主修/单身散修/旧契约与重复命令。整合后需父线程公共dispatch/save/UI检查，不把领域测试称全流程真人验收。

## 现场与路由

`NascentPanel.vue` props game/busy、emit act Intent/leave；可直接挂StoryScenes。所有本域动作要求外海ferry、conclave away、lizhao away；不能在离照现场直接凝婴。元婴能力兑现是古渡附近潮隙勘测、护持与护渡，回星墟长途尚未开放。

## 联络共享查询接入请求

C将提供 `src/nascent-soul/contact.ts` 纯查询 `companionContact(s)`（返回known/reliable/present），按A现有companionNews年龄窗口+whereabouts。请A把companionNews的“200年未知近况”判断改用这一纯查询，避免从rules互相导入造成scene-activity循环。C会用同一查询约见/仪式/来客，未知去向只可寄信/暂缓，不造死亡。

## 联络窗口更新（16:12）

`companionContact` 现返回 `lifespan`（月，2400或6000）、`confirmedGolden`，以及原known/elapsed/age/reliable/present。依据A字段companionGoldenAt的已发生事实提升至500年窗口；未确认仍200。约见成本6月的最终时间也校验同一个lifespan，不再硬编码2400。C不写该字段、不自行授予伙伴金丹。A可直接复用contact.ts纯查询，不需导入C rules。
