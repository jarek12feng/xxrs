# 开篇动作素材记录

2026-11-03，内置 imagegen 生成。运行素材 `public/art/scene2d/hero-actions-v1.png`：1536×1024 RGBA，4列2行，每格384×512；脚点约98.5%。男性炼气主角，前4格配药，后4格稳阵、伸手、搀扶和脱险。

首版源文件：`/Users/admin/.codex/generated_images/01a19bf4-3a30-7b70-98bf-92383c10f7d2/exec-d7698f75-5033-4b07-9b47-32addf67fa65.png`，存于本目录 `hero-actions-rejected.png`，有半透明白底，未接入。

清理版源文件：`/Users/admin/.codex/generated_images/01a19bf4-3a30-7b70-98bf-92383c10f7d2/exec-3b3c5b37-4be1-49cd-976c-1e793394a443.png`，原样复制为运行素材。抽查背景 alpha 为0；1280×720 药庐深色背景实机截图确认无白色矩形。素材只用于短姿态序列，不是高帧率完整动作动画。

## 原始提示词

参考现有男性炼气站姿与 opening-people-v1.png 右侧药工，透明背景输出。

```text
Create a transparent 2D game action sprite sheet, 1536x1024, STRICT 4 columns by 2 rows of equal 384x512 cells. All figures full body, feet baseline 94% cell height, head 8%, no cropping or labels. Reference 1 is the hero identity: young Chinese male, sage green and ivory hanfu, brown boots, black tied hair. Reference 2 RIGHT is the middle aged brown robe herbal worker identity; do not include the female character. Match painterly Chinese fantasy style. TOP ROW four distinct preparation poses of hero alone facing right: 1 taking herbs from a small pouch into left hand, 2 leaning forward holding a small stone mortar and grinding herbs with pestle, 3 using both hands to tie a small cloth medicine packet, 4 holding the finished tied packet forward. BOTTOM ROW four distinct rescue poses: 1 hero alone bracing both palms outward at shoulder level toward unseen stone gate, 2 hero alone leaning forward extending open hand to help, 3 hero supporting the brown-robed worker by shoulder with the worker leaning on hero, 4 same pair safely upright standing together after rescue. In pair cells make both fit fully, heads same scale as solo cells. NO stone gate or scenery, no ground shadows, no white or gray haze or glow. Everything outside silhouettes must be alpha zero. Each cell independently centered; keep faces/clothing consistent throughout. Production cutout sprites for in-world short action sequences.
```

## 透明底修正提示词

参考首版输出，透明背景输出。

```text
Remove the white background from this game sprite sheet. Preserve all eight illustrated poses exactly, including the paired figures, all positions, dimensions, 4x2 grid, 1536x1024 output. Deliver real fully transparent alpha=0 everywhere outside silhouettes. REMOVE ALL WHITE GRID LINES AND WHITE HAZE. Background must not remain semitransparent white. The figures will be composited on dark green game scenery. No repainting characters, no cropping, no extra glow, no drop shadows, no checkerboard drawn in image. Only clean alpha matte around figures with subtle edge antialiasing.
```
