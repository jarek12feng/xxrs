# 拍卖会背景交付 · 2026-11-05

本聊天仅制作素材，使用内置 image_gen 两次独立生成，无拼图。遵循 AGENTS.md 与 docs/art-direction.md。最新地点纠正已落实：筑基专场属于晴川药庄交易院，不属于山下坊市。

| 最终文件 | 用途与构图 | 实测尺寸 |
| --- | --- | --- |
| `../../../public/art/auction/market-hall.webp` | 听松山下坊市小拍：临街木厅、药柜、低木质拍台、暖灯、朴素木凳 | 1920×1080 |
| `../../../public/art/auction/foundation-hall.webp` | 晴川药庄交易院筑基专场：独立石厅、隔席、玉石拍台、护物阵纹、青金照明；外景含水道、石桥与成行药田 | 1920×1080 |

## 原图与转换

- 原图分别存于 `originals/market-hall.png` 和 `originals/foundation-hall.png`，两张实际均为 **1672×941**，RGB 不透明背景。
- 精确生成提示词见 `prompts.md`。生成工具返回路径位于 `/Users/admin/.codex/generated_images/01a1a9b4-479e-7680-926f-3b280deef9a8/`，已复制原图归档。
- 使用 cwebp 缩放编码为 1920×1080，品质 90、method 6；非原生 1080p，约放大 1.15 倍。原图比例约 1.7768，目标 1.7778，直接缩放的比例调整约 0.05%；无裁切、拼接或添加内容。
- 逐图转换命令（在仓库根目录执行，NAME 为 market-hall 或 foundation-hall）：

```sh
cwebp -quiet -q 90 -m 6 -resize 1920 1080 docs/art-candidates/auction-20261105/originals/NAME.png -o public/art/auction/NAME.webp
sips -z 180 320 docs/art-candidates/auction-20261105/originals/NAME.png --out docs/art-candidates/auction-20261105/QA/NAME-320.png
sips -z 54 96 docs/art-candidates/auction-20261105/originals/NAME.png --out docs/art-candidates/auction-20261105/QA/NAME-96.png
```

## 实际视觉 QA

已查看两张最终 WebP 全图及四张独立缩略图（320×180、96×54）。

- 木厅：药柜、临街门、低木台与暖灯均清楚；中央偏左拍台可辨。右下为大面积木地板，可供面板覆盖。
- 石厅：左侧隔席、环形台阶与玉台、水道和药田可辨；空间结构与木厅显著不同。右下为低细节石地板，可供面板覆盖。
- 两张均未发现文字、水印、现代物品或人物。装饰为几何回纹、竹叶图案，不是标签或可读字。
- 320px 下两处拍台与室内外关系仍清楚。96px 下仍能辨别木厅/石厅及拍台轮廓，但丹瓶和阵纹细节不可辨，不声称微小预览可读所有细节。
- 石厅日光与树影比木厅明亮；实际半透明交互面板的文字对比仍须在主聊天接入时验收，本次未运行 UI。

## 交付边界

仅在 `public/art/auction/` 与本归档目录新增文件；未修改代码、共享文档或其他美术，未提交。最终路径可供主聊天接入，不代表本聊天完成场景挂载、全屏交互或游戏验收。未运行应用测试和构建；完成范围内尺寸、格式、缩略图与文档空白检查。
