# 金丹现场素材记录

2026-11-03；使用内置 image_gen，未使用 API/CLI。最终运行资源位于 `public/art/conclave/`，同目录原有 court.webp、vault.webp 未覆盖。源 PNG 归档在本文目录。生成源另保留在 `/Users/admin/.codex/generated_images/01a19b54-abab-7e90-bff9-334e43b7b522/`。

| 运行文件 | 源图文件 | 原始尺寸 | 运行尺寸 | 用途 |
|---|---|---|---|---|
| court-empty-v1.webp | court-empty-v1-source.png | 1672×941 | 1672×941 | 会谷空石台，保留两侧静态观众 |
| gu-cangyao-v1.webp | gu-cangyao-v1-source.png | 1024×1536 | 512×768 | 古渡、会谷及首名对手 |
| ye-wenling-v1.webp | ye-wenling-v1-source.png | 1024×1536 | 512×768 | 古渡、会谷人物 |
| ji-wenshuang-v1.webp | ji-wenshuang-v1-source.png | 1024×1536 | 512×768 | 照霜门具名对手 |
| cheng-yanzhou-v1.webp | cheng-yanzhou-v1-source.png | 1024×1536 | 512×768 | 衡璇院具名对手 |

运行导出使用 cwebp：背景 quality 86；人物 quality 90、alpha quality 100，缩至512×768。人物源图有真实 alpha，已检查四角透明，未以黑色矩形替代背景。源图查看器中的背景色不参与合成。1280×720 会谷与首场斗法实际检查人物全身、落地、比例、背景无重复斗法者；纪闻霜在胜后候场实际显示。程砚舟源图及缩图已检查，尚未人工打到第三场。人物未制作完整出招帧。

## 提示词

### court-empty-v1

参考/编辑目标：public/art/conclave/court.webp；transparent_background=false。

Edit this Chinese xianxia game background. Preserve the painterly style, mountain valley, pavilion, spectators on the side terraces and daylight. Remove the two fighting figures and ALL spell trails in the central stone arena completely. Expand the clean flat stone arena toward foreground, so central lower 60 percent is usable ground for separately rendered player/NPC sprites. Keep spectators confined to far left and right edges and upper terraces, no figures in central playable ground. Landscape 16:9. No text, symbols or UI. This is an empty interactive arena environment, not a painted fight.

### ji-wenshuang-v1

全新素材；transparent_background=true。

Chinese xianxia 2D game character sprite, painterly realistic ink and soft watercolor matching classical Chinese fantasy landscape. Ji Wenshuang, adult female cultivator from frost sword sect, composed face, black hair high pinned bun, layered pale grey-blue Chinese hanfu with restrained frost embroidery, narrow sleeves, cloth boots, holds a straight Chinese jian low beside her. Full body head to both feet fully visible, three-quarter facing left, readable upright combat-ready stance, no attack effects. Entire isolated character on true transparent alpha background, no ground, no background, no text, no glow, no mist, no border. Preserve natural anatomy and a calm martial presence. Portrait canvas.

### cheng-yanzhou-v1

全新素材；transparent_background=true。

Chinese xianxia 2D game character sprite, painterly realistic ink and soft watercolor matching classical Chinese fantasy landscape. Cheng Yanzhou, adult male scholar cultivator of an array sect, lean scholarly face, black hair in a neat topknot, ochre and deep indigo Chinese scholar robes, layered cloth belt, cloth boots, holds a modest bronze circular formation disk in left hand and forms a seal with right hand. Full body head to both feet fully visible, three-quarter facing left, readable upright composed stance. Entire isolated character on true transparent alpha background, no ground, no background, no text, no glow, no mist, no border. Natural anatomy, no western or science fiction features. Portrait canvas.

### gu-cangyao-v1 / ye-wenling-v1

分别以 public/art/outer-sea/gu-cangyao.webp、ye-wenling.webp 为编辑目标，独立调用；transparent_background=true。两次使用同一提示词：

Identity-preserving edit for a Chinese xianxia game scene sprite. Keep EXACTLY the same person's face, hairstyle, robe colors, Chinese clothing, hand-held object and painterly style as reference. Expand into a FULL BODY standing character from head to both boots, with comfortable margins all around, both feet fully visible. Proportionate anatomy, natural upright three-quarter stance. Continue the existing robe down to shins, add plain matching Chinese cloth boots, not western garments. The character must stand on an imaginary floor, no ground painted, no crop at waist, no fog or glow. Entire isolated character on true transparent alpha background, no text, no shadow rectangle. Portrait canvas.

## 复用

主角待机/守势/出招使用已有男性主角及女性兼容姿态；会谷男性行走复用 public/art/scene2d/hero-qi-walk-v2.png 的八帧衣装。石卫/守珠傀儡使用既有 golem.webp；书册、镇潮印复用 outer-sea 素材。定神珠与照神阵枢采用表现层简化几何，不冒充新生成的道具图或完整特效动画。
