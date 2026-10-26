# 松风有约 v0.5

## 已实施

两条成年异性人物线：男修结识沈听澜，女修结识尹照川。十八岁后相识，共勘旧路、灯下谈心、赛后相叙形成有限共同记忆；好感达到 50 后可定情，也可暂缓，不降好感。免费回应组合可达 53，不强迫送礼。婚礼和婚后生活尚未实现，定情不提供战斗数值。

听松擂台是三位 NPC 的单机赛事，不是真实排行榜。先观摩，再按破势、守息、识阵应对三合招式；功法、根基和灵器影响结果。失败需养伤和准备，不能刷首胜奖励。第三位对手要求筑基；赛后相叙允许一次获胜或两次败场（包括主动认负），不把恋情锁在夺冠之后。

## 场景与资源

日间相逢复用山水背景，月下谈心使用冷蓝月色与暖灯，赛后相叙和擂台使用金色夕照与松绿旗幡。场景、当前说话人的头像、遮罩光色联动；进入时轻淡入，尊重减少动态效果设置。没有自动播放音效。新增四张图由内置 imagegen 生成并人工查看，原文件保留。

- public/characters/shentinglan.png
- public/characters/yinzhaochuan.png
- public/scenes/moon-terrace.png
- public/scenes/sect-arena.png

## 存储与规则

状态版本 5；social.ts 为纯规则，world.ts 负责调度；legacy-v4.ts 冻结旧格式校验。v4 迁移只补 social，不重置原进度；首次保存保留 original-v4。旧档由玩家自行补选性别。本世确定后不更换，新世重置关系与比赛。待决剧情及擂台回合均自动保存，刷新不重抽随机数；交锋中禁止修行和换装。当前仍为 IndexedDB 本地单机，不含后台或 MySQL。

## 验证

自动测试覆盖双人物线完整定情、成年门槛、旧档迁移、剧情冻结与失效选项、比赛失败与恢复、随机重放、40 种种子下充分准备后通关。浏览器使用独立 5178 端口和测试存档，检查月下剧情及擂台交锋刷新恢复；不操作用户 5173 的存档。

## 最终图像提示词

### 1

Use case: stylized-concept. Asset: original Chinese cultivation game character portrait, Shen Tinglan, an adult woman about 24. Subject: independent cartographer cultivator, expressive warm dark eyes, composed smile, dark hair loosely braided over one shoulder with a simple silver pin, modest dusty teal and cream travel robes, holding a rolled blank map. Waist-up vertical portrait, natural pose. Scene: misty river overlook with tiny distant pines, warm ivory rice paper, restrained ink wash and fine watercolor with realistic but painterly facial details, muted sage and blue, hand-painted storybook wuxia aesthetic. A distinct original face and grounded personality, not glamorous idol photography. No written characters, no labels, no logos or watermarks, one person only.

### 2

Use case: stylized-concept. Asset: original Chinese cultivation game character portrait, Yin Zhaochuan, an adult man about 26. Subject: thoughtful wandering formation repairer, slightly tanned skin, warm steady dark eyes, subtly smiling, short loose strands around a tied-back dark ponytail, modest ink-blue travel robes with ochre trim, small bronze compass held at waist. Waist-up vertical portrait, natural three-quarter pose. Scene: misty stone bridge beside river, warm ivory rice paper, restrained ink wash and fine watercolor with realistic but painterly facial details, muted sage and blue, hand-painted storybook wuxia aesthetic. A distinct original face and grounded personality, not glamorous idol photography. No written characters, no labels, no logos or watermarks, one person only.

### 3

Use case: stylized-concept. Asset: wide environment background for a Chinese cultivation game's intimate but nonsexual conversation scene. An empty mountain terrace with weathered stone railing, pine silhouettes, a small wooden table with two cups of tea and one warm paper lantern, distant mist and a soft moon reflected in mountain water. Atmosphere: quiet companionship, blue-grey moonlight contrasted with amber lantern, warm ivory rice-paper texture and fine watercolor ink painting. Wide landscape, visually calm central area for scene title, no people, no written text, no logos or watermark.

### 4

Use case: stylized-concept. Asset: wide environment background for a Chinese cultivation game's sect tournament. An empty circular pale stone sparring platform in a mountain courtyard, restrained pine-green banners without symbols, old steps, pine trees and misty peaks, warm late afternoon sunlight, fine traditional ink-and-watercolor on ivory rice paper. Mood: anticipation and dignified competition, not war. Wide landscape, central ring readable, no people, no text, no logos or watermark.

