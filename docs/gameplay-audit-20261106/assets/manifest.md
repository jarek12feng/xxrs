# 新增人物素材来源

均由本会话内置 image_gen 工具生成，transparent_background=true；原件保留在 `/Users/admin/.codex/generated_images/01a1ae4a-8f8c-71d1-94bf-d8273702f56e/`。本目录保存原始PNG；运行时位于 `public/art/scene-people/`，cwebp -q 85 仅编码成WebP。均为1024×1536 RGBA；四角alpha=0，透明比例61%～66%。实际背景合成以浏览器截图检查。

| 角色 | 原始工具文件 | 运行时文件 |
| --- | --- | --- |
| 许照岚 | exec-177b8f8c-a0f1-43ec-96b1-812c4ae50a73.png | xu-zhaolan-standing-v1.webp |
| 裴铸 | exec-2f691602-a506-4abd-bbaa-fdfdfc70ced1.png | pei-zhu-standing-v1.webp |
| 卢雁回 | exec-3bdcd013-f573-481b-9c08-e1e9638f081e.png | lu-yanhui-standing-v1.webp |
| 药船修士 | exec-df39f959-58e0-485b-936b-e518e3961377.png | lizhao-apothecary-v1.webp |
| 岑霁 | exec-cd1bbb5e-2ba5-4d40-a928-3f6143959d29.png | cen-ji-standing-v1.webp |

## 提示词与身份约束

许照岚、裴铸：以原有肖像为身份参考，保持面容衣冠，扩展为全身站姿与布鞋，透明背景。许照岚保留朴素灰绿麻衣与药篓，裴铸保留胡须发髻、深褐修器衣、护腕与垂下的锤；禁止背景、文字、光环，2:3构图。

卢雁回：single transparent-background full-body NPC sprite for a Chinese xianxia RPG, painterly detailed semi-realistic style with muted earth tones and natural soft lighting. Adult female wandering qi cultivator, surveying abandoned medicinal caves and copying field notes. Slate-blue and faded ochre layered Chinese robes, cloth boots, pinned dark hair, worn satchel and handwritten notebook. Alert, self-reliant; three-quarter facing right. No ground plane, scenery, text, border, or background. Clean transparent alpha, vertical 2:3.

药船修士：adult middle-aged medicinal ship cultivator at Lizhao harbor, practical weathered Chinese man in muted indigo and warm gray layered linen hanfu, tied dark hair with gray strands, cloth boots, herbal sachets, bamboo tray with closed ceramic medicine bottles. Calm, three-quarter facing left, head and feet visible. Hand-painted semi-realistic style, soft natural light, no armor, aura, harbor, scenery, ground plane, text or border. One isolated character, transparent alpha, vertical 2:3.

岑霁：以 public/art/foundation-growth/cen-ji.webp 为参考，preserve the exact adult Chinese woman's face, hair, gray-teal practical robes and medicine jar. Extend to full-length traditional robes and cloth shoes. Head to shoes visible, standing three-quarter facing right. Remove all apothecary scenery, tables, herbs, windows, floor and text. Painterly semi-realistic Chinese xianxia, clean transparent alpha, vertical 2:3. Practical apothecary, not glamorous warrior.

未覆盖旧肖像；新增立绘已接运行时，不是未接入候选。透明属性只能证明没有矩形背景，不能代替人工检查每一根发丝或所有分辨率。
