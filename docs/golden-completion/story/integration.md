# G1–G5 集成契约（A，2026-11-04）

父线程请接 `State.goldenStory: GoldenStory`（`src/golden-story/state.ts`），初始化 `freshGoldenStory()`，校验 `validGoldenStory(s)`，迁移保守 fresh，不补发故事与合作。历史保留至元婴。

命令 `{type:'goldenStory', action: GoldenStoryAction}`；rules.ts 导出 `goldenStoryQuote(s,a)` / `runGoldenStory(input,a,id,tick)`，签名同 runSea。`goldenStoryActive(s)` 返回 false：此域均为安全地点的原子交接，不持有旅行/战斗；quote 全面拒绝其他域活动。UI 由A接三个既有Panel，现场热点打开局部操作，不增加常驻菜单。

动作：`direction` choice `sect|independent`；`observe` point `gauge|flow`；`duty` duty `ward|survey`；`measure`；`oldRecord`；`ask` topic `method|spirit|pill|ground` source `seat|public`；`rubbing` recipient `chengyuan|hengxuan|zhaoshuang|retain`；`companion`。

共享规则建议（由父线程落实）：
- goldenQuote 的 cross（实际动作名请核查）前要求 goldenStory.direction !== 'none'，可在原凝丹现场问路；宗门与散修均可完成。
- seaQuote pact 前要求 goldenStory.tideComplete。观潮含两处测读、护堤/校图分工与一个月实际复测；公开/保留仍由原 pact 命令决定，不在此篡改 pact。
- G3/G4/G5不加永久晋升锁。公开问法在外海古渡即可，无宗籍、冠军、会期要求。C可查询 `goldenTeaching(s)`，未问法仍允许由自己的公开教学路径补齐。
- `goldenCooperation(s)` 返回 `{harbor, charts, frost}`。G5两份有限可复制拓本：澄渊维护、衡璇校图、照霜补卷，可给不同宗门或自留。原定神珠、抱元录、灵髓不动。建议 harbour/charts/frost 分别用于后续护持/独行探路/传承协作报价，不构成必需门槛；A会在自己的问法复核呈现不同实际合作。

时间和成本：观察/选分工/分配/旧录/问路为0月；实际复测1月，护堤耗2灵草，校图耗4灵石；首次问法1月，无物资；同主题不可重复领奖（没有修为/灵石奖励）。领域处理 tick 中断，未完成不扣物资不结算成果。

伙伴消息按相识月与本人经历出具，绝不读玩家金丹小阶段赋值伙伴境界；过寿元窗口只提供旧信/后人转交的未明去向，不虚构在场或死亡。

已实现的合作差异：澄渊拓本让 ground 问法、衡璇拓本让 spirit 问法、照霜拓本让 method 问法免一月重新核验；原本每题一月，均无物资奖励。后续领域可继续使用只读 cooperation；不是虚假的全界声望。
沈观微现场以月2400以前为首期有限在场窗口；此后采用同份公开实录和传讲人，不让本人跨无限年代固定在席。陆怀真身份按旧册基准说明，不强称任意年月仍在任。此为保守消息呈现，不是完整NPC寿命模拟。

## A完成状态（16:01）

规则与三个原Panel已落地；State/dispatch/远行问路与pact实测门槛已观察到父线程接入。已显式拒绝离照任意非away地点，以及 nascentSoul.trial/attempt；统一 activityInterruption 继续拒绝其他探索/战斗/旅行/拍卖。问法/实测月结遇新会谷来信则中断，不提前结算。

伙伴来信按 social.metMonth 的年月进展（0/10年/50年）描述独立修行与筹备，没有自动升境；超过筑基寿元参考窗只交旧信、不推定死亡或在场。校验禁止伪造未来来信。此边界不等于完整NPC生命模拟。

## 伙伴金丹消息修正方案（执行中）

新增 `companionGoldenAt: number|null`（本人凝丹实际月）与 `companionConfirmedAt: number|null`（玩家收到近况确认月）。不会在tick或玩家突破时赋值，只在执行goldenStory companion收信命令时写入。

独立成长资格要求已保存的苏婉宁修图、独立古道探路、补给与营救收束、沉井传承事实；时间取相识至少80年、首次分别至少50年，并以玩家formedAt作为“此前共同筑基经历肯定已经收束”的保守时间上界，再留本人30年独立备药/失败恢复/重炼期。formedAt仅避免把凝丹日期倒填到筑基营救之前，不用玩家realm/stage推断成功。若本人在此日期已超过筑基200年，则不生成成功消息。

信件新增id4：清楚列出独立取药、第一次凝丹失败、恢复重备与第二次成功年月；收到时附当前药路驿站近况回执。超过金丹500年则仍走未知id3，不判死亡。未收信 `companionGoldenAt` 保持null；读投影不赋值。

C contact请使用已确认字段和500/200年寿元窗；所有旧硬编码 `age + 6 >= 2400` 改为 `age + 6 >= companionContact(s).lifespan`。仅根据eligible推算但尚未收信的情况不能用于结契放行。正常三主修检查点应通过收信命令拿到确认，不改年轻fixture。

### 伙伴修正已完成（16:16，覆盖旧200年固定未知方案）

`src/golden-story/companion.ts`导出 `companionChronology`、`companionNews`；rules保留re-export，原调用不用改。GoldenStory新增上述两个nullable字段，fresh均null；validator要求真实资格、发生日<=确认日<=当前月、成功信id4与字段互证，确认时本人年龄须<500年。无消息不填日期，恢复/失败不延寿；元婴后保留已确认历史。

信件id5为首次失败，id6为恢复重备，id4为成功及收到时的近况核验；日期分别goldenAt-240、goldenAt-120、goldenAt。允许多年后一次收到注明原年月的成功信；收到此前不按候选日期放行结契。超过500年仍id3未知。尹照川尚未写独立凝丹经历，沿用原200年可靠窗，不套用苏婉宁经历。

已用 `goldenLateCheckpoint`→`finishGoldenCompletion` 三主修真实公共命令路径（未改年轻fixture），读取圆满checkpoint，确认本人年龄>200年且confirmedGolden/reliable成立，`nascentSoul contact`实际dispatch成功、validState与保存往返通过。专项4文件22项通过，包含三个真实路径及消息边界；C contact已观察到改为lifespan而非2400。
