# 沧澜会馆背景交付

日期：2026-11-05。地点为外海商盟独立海上会馆「沧澜会馆」，用于金丹专属、十年一届的拍卖会。周期属于玩法设定，不绘制文字标识。

## 文件与生成

- 最终文件：`../../../public/art/auction/golden-hall.webp`，实际 **1920×1080**，392506 bytes，16:9 不透明 WebP。
- 原图：`originals/golden-hall.png`，实际 **1672×941**。
- 工具：内置 image_gen，一次独立生成；完整提示词见 `prompts.md`。
- 原始返回文件：`/Users/admin/.codex/generated_images/01a1a9b4-479e-7680-926f-3b280deef9a8/exec-1183fc14-e747-4b18-ae03-b20c474102a7.png`，已复制归档。
- 从原图约放大 1.15 倍导出，非原生 1080p；原图与目标比例差约 0.05%，直接缩放，无裁切、拼接或额外绘制。

## 转换命令

仓库根目录执行：

```sh
cwebp -quiet -q 90 -m 6 -resize 1920 1080 docs/art-candidates/auction-golden-20261105/originals/golden-hall.png -o public/art/auction/golden-hall.webp
sips -z 180 320 docs/art-candidates/auction-golden-20261105/originals/golden-hall.png --out docs/art-candidates/auction-golden-20261105/QA/golden-hall-320.png
sips -z 54 96 docs/art-candidates/auction-golden-20261105/originals/golden-hall.png --out docs/art-candidates/auction-golden-20261105/QA/golden-hall-96.png
```

## 视觉检查

已实际打开最终 WebP 全图、320×180 与 96×54 缩略图。

- 中国式斗拱、靛蓝柱梁与海浪青铜装饰，开放深蓝海面、岛屿与中式商船；矩形白玉台及青铜护宝阵清楚。区别于暖木坊市药柜厅、晴川药田圆台石厅。
- 四处热点可分布：左前管事柜台、左后陈列柜、中央偏左拍台、右后通往海廊的出口。管事柜台靠画面左缘，演员位置宜放在其右侧空地，需由主聊天结合实际 UI 调整。
- 前景及右下为宽阔空地，无人物、文字、伪字、UI、水印或现代物品；装饰采用浪纹、回纹与几何阵线。
- 320px 下拍台、陈列、出口与海景可辨。96px 下仍可辨深蓝海厅、白色矩形拍台与右侧出口，但丹瓶、阵纹和商船细节不可辨。
- 右下虽低细节，仍有石面反光；半透明面板文字对比及真实热点/人物遮挡未做游戏内验收。

## 范围

本次仅新增 `public/art/auction/golden-hall.webp` 与本归档目录文件。未改代码、已有两张拍卖背景或共享文档，未提交、未推送。素材已备妥供主聊天接入，不代表已完成金丹拍卖会功能。尺寸和图片检查已完成，新增 Markdown 使用 no-index diff 空白检查；未运行应用测试或构建。
