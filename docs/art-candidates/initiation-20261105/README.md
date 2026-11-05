# 药乡入道与听松入宗：独立场景候选

日期：2026-11-05。使用内置 `image_gen` 分别实际生成两张背景。仅为美术候选，未接入游戏，不代表剧情、角色行走、真实 UI 或 Windows/Steam 验收。未提交、未推送。

依据：`AGENTS.md`、`docs/art-direction.md`、`docs/narrative/09-world-and-sects.md`。听松为依靠药路、炼丹和护送的地方中小宗门；丹堂与剑院属于同一宗门。

| 交付文件 | 用途 | 实际原图 | 导出 | 文件大小 |
| --- | --- | --- | --- | --- |
| [herb-ferry-arrival.webp](exports/herb-ferry-arrival.webp) | 雨后药运渡口、药乡求道起点 | 1672×941 PNG | 1920×1080 WebP | 777772 bytes |
| [tingsong-admission-court.webp](exports/tingsong-admission-court.webp) | 山门药坪、拜师交谈场景 | 1672×941 PNG | 1920×1080 WebP | 851830 bytes |

## 归档

- `originals/`：工具 PNG 原图完整复制，未改动；工具默认缓存源路径记录于元数据。
- `prompts/`：两次调用的完整提示词；均设置 `transparent_background=false`，独立生成，无参考输入。
- `exports/`：精确 16:9 的交付 WebP。
- `QA/metadata.json`：真实尺寸、工具来源、文件大小、SHA-256、转换参数。
- `QA/*-320x180.png`、`QA/*-96x54.png`、`QA/contact-sheet.png`：从最终 WebP 解码后生成并实际查看的缩略图。
- [QA 记录](QA/review.md)。

导出采用 Pillow `ImageOps.fit` / LANCZOS，在极小居中裁切后放大至 1920×1080，WebP quality=93、method=6。原生生成分辨率并非 1920×1080；放大不增加原始细节。未进行内容重绘或合成。

本次仅新增此目录内文件，已有其他工作区修改属于并行任务。未修改 src、public、存档或其他文档。资产制作未运行应用测试或构建，不作游戏功能验证声明。
