# 开篇素材生成记录

2026-11-03；使用内置 imagegen（非 CLI）。所有最终图已复制到项目 public/art/scene2d/。原始输出保留于 /Users/admin/.codex/generated_images/01a19bf4-3a30-7b70-98bf-92383c10f7d2/。

## 步态初版（弃用）

参考：public/art/hero-male/qi-idle.webp。输出 exec-5945b9b1-68a1-4136-ab23-ab41f968c362.png，项目归档 hero-qi-walk-v1-rejected.png。transparent_background=true。存在白雾，未用于最终运行。

Create a production 2D game WALK CYCLE SPRITE SHEET, transparent background, landscape 1536 by 1024. Reference image defines exact male Chinese xianxia protagonist: same young adult face, tied black hair, sage green outer robe, ivory inner robe, brown belt and boots. Painterly realistic Chinese fantasy style matching reference, no armor. STRICT GRID: 4 equal columns and 2 equal rows, exactly 8 frames, no labels, no borders. Each cell 384x512. Each frame same full body character facing RIGHT in three-quarter profile, centered horizontally in its cell, soles aligned 94 percent of cell height, top of head at 8 percent cell height, all cloth/hair inside cell. Ordered walk animation left-to-right top row then bottom row: right foot forward contact, weight down, passing legs, left leg raising, left foot forward contact, weight down opposite, passing legs opposite, right leg raising. Feet visibly alternate, arms counter swing softly, robe and hair follow motion subtly, head size and torso stable between frames. Do NOT repeat idle pose. No terrain, no ground shadow, no objects, no text. All eight complete figures separated by transparent gutters. This is a new sprite animation based on character reference, not a collage.

## 步态透明修正（已接入）

参考：上述初版。输出 exec-37d5acd3-bbee-46c1-809a-c9a6afccdf61.png，对应 hero-qi-walk-v2.png。transparent_background=true。

Remove ALL white/gray background and ALL white haze/glow from this sprite sheet, producing clean fully transparent alpha (0) outside character silhouettes. Preserve all eight character frames EXACTLY in their existing positions, sizes, poses and 4-column 2-row grid at 1536x1024. No new shadows, no halos, no background, no retouching or repainting character. Hair and robe edges should have normal antialiasing only, not surrounding glow. It will be placed on a dark green game scene. The previous image had an unacceptable white cloudy rectangle around each frame; completely remove that.

## 温蘅与药工（已接入）

参考：public/characters/wenheng.png。输出 exec-671d8fa2-7ca6-47bb-9eff-fa50b6dd0bed.png，对应 opening-people-v1.png。transparent_background=true；实际1254×1254。

Make a game character spritesheet transparent background, exactly 1024x1024, TWO equal 512x1024 vertical cells. LEFT cell: full body female Chinese xianxia apothecary Wen Heng, exactly same face, herb hair ornament and sage/ivory floral robes as reference, calm welcoming expression, holds a small wrapped herb packet in one hand and offers it toward viewer with other. RIGHT cell: a different middle aged male humble Chinese herbal worker, brown and grey linen hanfu, tied hair, cloth shoes, holding a small wicker herb basket, tired but safe upright standing, no wounds or blood. Both complete full body isolated with shoes visible, ground soles at 94% cell height, head at 8%, figures centered at x256 and x768. Soft painterly realistic illustration, matching reference Chinese ink fantasy rendering. No background landscape, no floor, no labels, no border, no light halos, clean transparent alpha. These are two independent world NPC sprites for a 2D scene, not portraits or posters.
