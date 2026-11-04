# 神识与凝婴接口协调

2026-11-04 本聊天继续独占 src/nascent-soul/*。已接入 spiritReadiness 的 trialMind、breakthroughBonus；禁室 mind 校验上限24，界面策略预览同步。仅禁室心神归零、凝婴稳定失败且心神归零时调用 injureSpirit，不把一般失败记为识海创伤。

天劫存档版本40接线已完成：world.ts 与 save-version.ts 即刻释放，可由神识聊天接管升下一版。v39迁移补 thunder fresh；已元婴保留 legacyCompleted；旧行功安全取消并退回已服的一枚丹药，不退时间。正在补40迁移测试；不再修改 world.ts/save-version.ts。

16:50 检查中 spirit/rules.ts 有 optional spirit 类型错误，留给模块实施者随接线修复。

16:50 实时集成阻塞：foundation-journey/progression.ts 新增 application 前置 manual learned 后，tools/foundation-journey-checkpoint.ts 尚无探阵研修，导致 goldenLateCheckpoint/全部凝婴测试报 Cannot start application。请神识实施者更新公共命令 checkpoint（本聊天不编辑其上游工具以免冲突）。此前三路正式天劫公共路径已通过，后续会再跑。

16:54 凝婴神识最终契约已同步：trialMind校验26；初始心神min(12,基数+bonus)，预览同口径；resistance实际抵减识海回震mindLoss（至少0），结算读相同预览。30项凝婴/天劫迁移/三路公共命令集成回归通过。开始全量回归与构建。

17:00 新审计修复由凝婴域继续负责：余寿全程30月校验、伤势每月1恢复与 preparationRates 同源、药理复核增加1稳定、护持预览明确、src/combat/game.ts 增加元婴通用投影气势/护体25%伤害20%（我独占该战力函数，未改神识映射）。首轮全量1220过/7失败：foundation-audio、spirit-growth-ui、substitute-playtest三项与新必经取法有关，secret-pact及sect-contest各1旧档迁移；完整输出 /tmp/nascent-full-tests.log，请各自实施者处理。构建已通过。

17:04 第二轮全量173文件1232通过/1失败，仅 tests/realm-compat.test.ts 仍断言元婴战力=金丹。已更新为三项实际增长，与新审计要求一致；最终整轮重跑 /tmp/nascent-full-tests-verified.log。神识与离照相关失败在本轮均未重现。本聊天专属音效/BGM尚未制作，已向用户明确。渡劫演出已提炼 src/scene2d/tribulation/，不依赖 State/境界/固定劫数，可供未来灵界飞升适配。

17:05 最终统一回归173文件1233项全过，构建/diff-check通过。证据已复制 docs/golden-completion/nascent/tests-final.log 与 build-final.log，设计/接口/失败修复记录见该目录 tribulation.md。无提交推送，未碰用户5334存档。
