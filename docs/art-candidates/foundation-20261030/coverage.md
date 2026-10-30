# 剧情覆盖与复用

本表覆盖此次已写剧情的场景需求，图像不替代剧情条件。详细每张图见台账。已有英雄、丹瓶、功法、妖兽和傀儡不重复制作。

| 剧情用途 | 本包候选 ID | 条件与复用方式 |
| --- | --- | --- |
| 无名渡日常、进入与回访 | wuming-ferry / ferry-return；ferry-steward / ferry-guard / frontier-boatman | 管事、看守、渡工是人族；回访图是不同机位候选，不用于逐像素改造动画 |
| 沉井遗府试探、外府挑战、传承 | sunken-entry / outer-training / inheritance-room / inheritance-case | 复用现有 golem 立绘，传承载体为玉简与布图，不指定新功法效果 |
| 姐弟重逢、救治、归路 | side-courtyard / healer-sister / yuqing-reunion / return-seal | 救治者有主动工作能力；姐姐姓名仍由剧情确定 |
| 两位知己职业与分歧 | shentinglan、yinzhaochuan 的 work / disagree / travel；survey-shelter / lamp-room / print-workshop | 沈绘图、尹修阵；保持专业和独立意愿 |
| 出关重逢、结契、独立成长、分别 | reunion / vow / growth 姿态；reunion-courtyard / vow-terrace / journey-fork | 结契须实际成立；普通重逢不必是恋爱；不凭外观推定境界 |
| 药庄、旧账与合作 | herb-estate / qu-heir / qu-elder / worker-scribe / testament-pages | 阙家人物为候选，不预设所有人物敌对或恋爱 |
| 雪线旧事、主门和西门 | snow-gates / old-steward / gate-relic / wenheng-care / jiheng-guide | 不把事故受害者画成刷怪材料；温蘅季衡保留原脸型 |
| 灯与面、普通人生活 | roadside-pavilion / inn-elder / badger-atuan | 阿团是獾，不升级成未设定的神兽；小亭不强加阴谋 |
| 新地域和新人物 | frontier-valley / frontier-peer / frontier-mentor / frontier-boatman | 角色身份、地区、境界待定；普通人也有可用形象 |
| 断讯、内部避险与双向救援 | signal-refuge / outer-rescue / rescue-open / recovery-stop；两位 rescue 姿态 | 被困者仍主动测路或稳阵；断讯不代表死亡，不绘制枷锁受虐 |
| 联络与纪念 | signal-pair / travel-letter / keepsake-bundle / farewell-garden | 确认状态后选用；旧物也可属于生者，无具名墓碑 |
| 炼气阶段职业伏笔 | revised-map / returned-proof / lamp-work-order / ordinary-spares | 只表现工作痕迹；署名与 NPC 是否知情由 UI 和状态控制 |
| 道侣不同场合服装 | shentinglan-simple / shentinglan-outfit-* | 成年道侣五套候选（含基础款）；服装数量不等于已实现换装功能 |
| 应答、路标 | array-response / route-mark | 静态效果层，不是动画帧；路标图含装饰，正式线索须同时给出文字 |

## 已有资源复用

- 玩家男女主角：`public/art/characters/hero-{male,female}*.webp`；本轮不按道侣要求改玩家形象。
- 傀儡与人族战斗：`public/art/characters/golem*.webp`、`raider*.webp`；具名对手使用各自既有资产。
- 丹药、功法、武器：`public/art/items/`；丹药用丹瓶、粉剂用药罐，功法按具体类型使用玉简或书籍。
- 老人物肖像：`public/characters/` 保留，剧情卡片可继续使用，不必为每句对白加载全身立绘。
- 音乐及既有行动音效见声音清单，全部按已有实际结果语义复用，不因换画面重放奖励音。
