# 陆迟人物表现包

## 人物设定

二十一岁的散修剑客，青灰旧衣，黑发半束，旧剑柄留三道刻痕。寡言、不善求助，记人恩情，弱点是习惯独自扛事。父亲入山采药失踪，母亲仍在渡口守灯；他急于筑基是为了深入山中寻父，不是单纯争强。说话短而克制，情感更多藏在行动里。

中段两次互动：第十二月未寄家书，玩家可以倾听、读懂或尊重沉默；第二十四月主动回访，陆迟带来物资、疗伤或共读机会。人物档案只展示本世已经获得的关系记忆，轮回清空。

## 已接入素材

目录：public/characters/。由内置 image_gen 生成，未使用 CLI 或外部图片下载。所有表情与场景引用同一基准图锁定身份；保留原生成 PNG，不做外部图像修改。

- luchi-base.png：戒备而平静的基准肖像，人物卡默认。
- luchi-injured.png：面颊轻伤、包扎手腕，初遇及破阵对话。
- luchi-relieved.png：释然浅笑、手持家书，相处后的立绘。
- luchi-foundation.png：完整青玉色衣袍，筑基后的阶段差分。
- luchi-ferry.png：渡口初遇场景。
- luchi-relic.png：遗府孤丹场景，石匣中只有一枚丹药。

表现由 src/characters.ts 纯投影提供。人物卡、对话头像、档案立绘与关键场景均使用这些本地文件。场景使用 contain 保持关键物件完整。没有配音、动画或第二名 NPC。

## 最终提示词集

### 基准图

Use case: stylized-concept. Asset type: production character portrait for a Chinese cultivation RPG. Original character Lu Chi, a young adult Chinese male wandering swordsman age 21, lean angular face, straight brows, dark attentive eyes, black hair half tied with a simple cloth cord, muted blue-grey patched hanfu, ivory inner collar, worn sword scabbard with three small carved notches near the hilt visible beside his shoulder. Calm but reserved expression, understated dignity, no glamorous jewelry. Vertical waist-up portrait, face clearly readable in a small NPC card, whole head and shoulders comfortably within frame. Chinese ink and mineral watercolor illustration, restrained semi-realistic anatomy, delicate brushwork, parchment ivory background with a very faint mist wash, low saturation sage teal and warm grey, softly lit. No typography, no watermark, no UI, no borders. This is the canonical identity anchor for later expression and costume variations.

### 受伤差分（基准图为编辑目标）

Edit this identity anchor into an early-story injured portrait. Preserve exactly the same recognizable adult face, hair, blue-grey patched robes, notched sword, parchment ink watercolor medium and vertical framing. Change only expression and injury details: exhausted, guarded dark eyes, faint small scratch on cheek, neatly bandaged wrist visible near chest, no blood or gore. No text or UI.

### 释然差分（基准图为编辑目标）

Edit this identity anchor into an intimate mid-story portrait. Preserve exactly the same recognizable adult face, hair, patched blue-grey robes, notched sword, ink watercolor medium, vertical framing and parchment background. Change only expression and posture: a subtle relieved closed-mouth smile, softer eyes, shoulders relaxed, one naturally drawn hand gently holding a folded cream letter near his chest. No text, no UI, no extra fingers.

### 筑基差分（两步，保持同一人物）

Edit this identity anchor into the same man after reaching foundation cultivation. Preserve exactly the same recognizable adult face, same age, black half-tied hair and cloth cord, same notched old sword, parchment ink watercolor style and vertical framing. He wears repaired, clean muted teal-grey robes with an ivory inner collar, not luxurious armor, expression serene and quietly confident. Very subtle mist halo, no flashy magic. No text or UI.

第一稿服装变化不明显，因此定向修订：

Identity-preserve edit. Keep this exact face, hair, sword, camera framing and ink watercolor parchment style unchanged. Change ONLY ALL of the clothing: replace every torn ragged outer robe with an intact, clean, finely woven but simple deep muted jade-teal hanfu robe with long smooth sleeves and narrow ivory trim, no tears, no holes, no patches, no fraying. Keep modest leather belt, no armor or jewelry. It must be visibly a new intact robe because the same character has achieved Foundation cultivation. No text.

### 渡口插画（基准图作为身份与风格参考）

Use reference image as the exact identity and style anchor for Lu Chi. Create one wide landscape narrative illustration, not a portrait sheet: the same young adult man in patched blue-grey robes with his notched sword sits beside an old timber ferry landing, a folded letter in his hand, awaiting someone. Misty jade-green river, distant mountains, reeds, faded wooden posts. Chinese mineral watercolor and ink on ivory paper, restrained semi-realism, muted teal grey, soft late-autumn light, contemplative. Man on right third with environment taking most space. No text, no UI, no other visible person.

### 孤丹插画（基准图作为身份与风格参考）

Use reference image as the exact identity and watercolor style anchor for Lu Chi. Create one wide landscape narrative illustration: inside a mossy ancient stone shrine, the same young adult in patched blue-grey robes kneels beside a small open stone casket containing exactly ONE small warm golden pill, a simple glowing sphere. He gently pushes the casket toward the viewer with a natural hand. Old notched sword beside him. Tense but generous expression. Muted mineral green, deep ink-grey stone, pale shaft of light, painterly refined Chinese ink watercolor, cinematic quiet composition. No text, no UI, no extra pills or extra people.
