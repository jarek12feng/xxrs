# 行路有痕 · v0.8.0

## 体验目标与取舍

让玩家通过观察认识人物，再用发现改变行动方式。仍沿用“背景上的故事与对白 + 独立操作区”，不将按钮散落在画面里。新增内容聚焦第二卷，未扩张地图规模，未增加刷取奖励或强制清单。尚未加入环境音、配音、婚礼、联机排行榜、后台数据库或商店安装包。

## 调查与挑战

- 坊市认识郁青后可看药队旧账册，了解药队歇脚时刻。
- 青嶂关观察危险后可看石阶刻痕，找到背风路线。
- 两条线索组合解锁避风过关：原把握 +10（上限 100），消耗灵石 6，失败不新增伤势。正面过关仍消耗 4，失败伤势 +1。两条路都要求筑基、伤势低于 3、实际功法/灵器/同行准备，并且每次只抽取一次状态中的随机数。
- 旅亭的旧名字揭示青嶂守路的原因，影响记路结尾与坊市回访对白。不另发资源，原记路奖励灵石 8 仍只能领取一次。
- 调查可跳过；每处只记录一次，不耗资源、月份或 RNG。手记可展开回看；调查与移动不会跳过待处理事件。死亡、封存及社交场景中禁止推进。

## 状态与迁移

状态版本 8，road 增加 discoveries（ledger / marks / names 的无重复集合）和 lastApproach（direct / sheltered）。校验发现对应的前置进度，并校验避风判定必须有两条线索和一次尝试。v7 原样保留资源、风险、随机种子、路线、历史判定及场景，只补空线索与 direct。v1–v6 继续原迁移策略；首次保存另保留 original-v7。未知未来版本拒绝覆盖。

## 素材与表现

内置 imagegen 生成，两张独立不透明水墨肖像；无参考图片。原始 PNG 留在生成目录，游戏使用缩至最长边 768 的 JPEG，未人工重画。肖像始终与对白绑定，郁青不在场时标为“郁青留下的话”。共享场景添加低强度薄雾和月色，prefers-reduced-motion 关闭雾层动画。

### 郁青

文件：`public/characters/yuqing.jpg`

提示词：Use case: stylized-concept. Asset type: Chinese cultivation game NPC portrait. Subject: Yu Qing, a young adult male itinerant cartographer, warm observant expression, black hair tied with a simple cloth, practical weathered sage-green robe and ochre shoulder scarf, carrying a rolled map and modest travel satchel. Waist-up centered composition with face clearly readable in a small portrait, no text. Backdrop soft blurred mountain-market lanterns, understated. Fine Chinese ink and watercolor on ivory rice paper, detailed painterly human face, grounded proportions, muted green and warm amber, consistent with an elegant ink landscape adventure. No armor, crowns, weapons, logos, lettering, watermark.

### 青嶂

文件：`public/characters/qingzhang.jpg`

提示词：Use case: stylized-concept. Asset type: Chinese cultivation game NPC portrait. Subject: Qing Zhang, an adult male mountain-pass demon cultivator, humanlike weathered face with calm stern protective expression, two small jade-green horns emerging from dark hair, dark teal layered robes, hand resting on a simple wooden staff, a worn rope sash. Waist-up centered with full head and horns inside frame, readable face in small portrait. Misty mountain stone pass background. Fine Chinese ink and watercolor on ivory rice paper, detailed painterly realism, muted sage, slate, jade, no horror, no evil grin, no ornate armor, no text, logos, watermark.

## 验证

- 规则覆盖调查地点/前置、重复操作、资源与时间不变、同种子同序列一致、正面和避风失败代价、准备门槛、成功记路及回访、损坏线索校验、v7 原档备份。
- SSR 覆盖两位人物肖像与调查操作区分离，既有场景背景文字和操作区约束继续通过。
- 独立端口 5181 的浏览器验收使用命令生成的筑基检查点，不改动 5180 用户存档：刻痕 → 账册 → 刷新保留 → 避风过关扣 6 → 旅亭调查 → 记路奖励 8 → 回访新对白。
- 390×844 实际操作与截图检查，360 像素宽度无横向溢出，头像加载正常，验收页无控制台 error。该检查不是所有设备的兼容性认证。
