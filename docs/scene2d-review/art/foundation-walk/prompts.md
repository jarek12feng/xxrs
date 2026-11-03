# 男性筑基步态 v1

2026-11-03，内置 imagegen（imagegen skill），参考 `public/art/characters/hero-male.webp` 的实际筑基衣装。原始生成路径 `/Users/admin/.codex/generated_images/01a19fd1-0942-7f31-bad3-60a3cd7c39bc/exec-fd1a889d-725b-44d4-aefb-d044785e5957.png`；原图归档 `original-v1.png`，运行时 `public/art/scene2d/foundation-walk/hero-male-v1.png`。1536×1024 RGBA，4×2 排列，单格384×512。未修改生成图像。只供本项目男性筑基行走；不冒称女性或高境界步态。

## 完整提示词

Use case: stylized-concept. Asset: 2D Chinese cultivation PC game sprite sheet. Reference image is the EXACT adult male foundation-realm hero identity and outfit. Preserve face, long black half-up tied hair, ornate layered ivory hanfu with pale green bamboo embroidery, dark teal-green sleeveless outer robe, dark leather forearm guards, gold-brown braided waist belt with hanging jade beads, dark boots. Create 8 consecutive natural WALK cycle frames facing RIGHT in a strict 4 columns by 2 rows grid, 1536x1024 pixels; each cell 384x512. Order left to right top row then bottom row: alternating foot contact, down, passing, up, opposite foot contact, down, passing, up. Distinct leg and arm movement, both feet and shoes visible below robe, robes sway subtly, no running. Full body centered identically within each cell, head baseline y=28, feet baseline y=500, consistent height and camera. Painterly detailed Chinese fantasy matching reference, no weapons or new props, no other people, no labels, no grid lines. Fully transparent alpha-zero background, no white haze, no shadow, no glow, no scenery. Clean cutout edges for compositing on dark scenery.

## QA

全图检查八帧全身与衣装：竹叶纹象牙白外衫、深青衣、束发和靴与现有筑基角色对应。角落、格间与空白采样 alpha 为0；脚部与衣摆未越出对应格。小尺寸实机检查另记录于 foundation-movement-next.md；本图不是八方向步态，向左时镜像。

第二次按格 QA：alpha ≥128 的头顶 y=8–9，脚底 y=494–496（单格坐标）；八格脚点波动2源像素，按260px角色高度约1px。八格四边各2px范围的 alpha 最大1–4/255，无不透明格线或跨格人物；边缘极低 alpha 保留原图，不另行抠图。与现有静止图脚底626/640相比，显示脚点约差2–3px，尚未据此认定实机有明显跳动。最终仍须看游戏中步态与静止衔接。
