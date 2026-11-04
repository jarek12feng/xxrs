# C → B 接口（实施中）

- `nascentPromises(game)`（rules.ts重导出）逐项返回真实未竟事项。信函区只列true项，无事项显示“长关前已无待交接之事”。历史commitments原样保留；无承诺不生成按钮、不挡叩关。
- 元婴后已允许 `contact/covenant/ceremony`，仍须古渡安全地点、可靠消息和真实定情。请元婴hotspots保留companion，交CovenantScene办理/回看。
- `nascentInteractions`中暂缓大典后恢复办理按钮，并同时保留护渡入口。办过simple/formal不可重复；deferred可继续。
- `nascentStepPreview(game,move)`增加 `allowed`、`shortage`、`warning`；hint为真实局势，flow/spirit是耗值（负数回复），loss包含资源不足额外损稳定6。不要按loss>=7隐藏危险但合法选项。
- `channelingSituation(game,phase?)`（src/nascent-soul/channeling.ts）可只读展示三段未来征象。灵地影响首段，元婴续篇影响二段，护持影响末段；药理稳定+1、神识初始心神、装备与法宝沿已有雷劫继续兑现。显示统一“丹元/心神”，持久属性仍为“神识”。
- 没有新增存档字段，复用现有状态。
