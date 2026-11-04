# A 批炼气与筑基背景候选

日期：2026-11-04。状态：candidate，3/3 张完成。仅制作场景底图，未集成游戏，未提交或推送。

交付根目录绝对路径：`/Users/admin/Documents/ChatGPT/xxrs/docs/art-candidates/world-story-20261104/early/`。

| 场次 | 原图 | 原图实际尺寸 | WebP 候选 | 导出尺寸 | 文件大小 |
| --- | --- | --- | --- | --- | --- |
| Q2 听松宗山门药坪 | [sect-medicine-court.png](originals/sect-medicine-court.png) | 1672×941 | [sect-medicine-court.webp](exports/sect-medicine-court.webp) | 1920×1080 | 490456 B |
| Q3 石涧旧药窟 | [stone-ravine-vault.png](originals/stone-ravine-vault.png) | 1672×941 | [stone-ravine-vault.webp](exports/stone-ravine-vault.webp) | 1920×1080 | 387172 B |
| F4 云外古道断碑驿 | [broken-stele-inn.png](originals/broken-stele-inn.png) | 1672×941 | [broken-stele-inn.webp](exports/broken-stele-inn.webp) | 1920×1080 | 464058 B |

三张背景均不透明，WebP 总计 1341686 B（约 1.28 MiB）。原图保留工具输出未改；生成请求为 1920×1080，实际返回 1672×941。导出通过 Sharp Lanczos3 等比 cover 居中重采样为严格 16:9；约 1.1483 倍放大及极轻微边缘裁切，不是原生生成 1080p。

## 提示词与来源

- [药坪提示词](prompts/sect-medicine-court.txt)
- [药窟提示词](prompts/stone-ravine-vault.txt)
- [断碑驿提示词](prompts/broken-stele-inn.txt)
- [来源说明](sources/README.md) 与 [含全部绝对路径的清单](sources/manifest.json)
- [可复现导出脚本](exports/export.cjs)：使用本机 bundled Sharp；原图已存在时不依赖生成缓存。

## 验收与缺项

- [x] 内置 image_gen 一图一调用生成 3 张，没有扩张张数。
- [x] 无人物、文字、UI、logo、水印；不烘焙生死、伏兵、奖励或固定关系。
- [x] 1920×1080 与 1280×720 六张实际结果逐张检查，构图、裁切及地面留白记录见 [QA/README.md](QA/README.md)。QA PNG 从最终 WebP 解码，包含压缩影响。
- [x] 药坪中下方留地面，左右可叠加角色；药窟左药床/中央干地与操作区/右阵石区可辨；断碑驿保留两人对峙与两侧退路。
- [x] 原图、prompts、sources、exports、QA 分目录归档。
- [ ] 未进行游戏内人物/HUD叠加、互动、寻路或 Windows/Steam 验收。图像空间不是碰撞和玩法实现。
- [ ] 生成器未返回请求的原生 1920×1080；已如实归档实际尺寸，1920 候选为放大版本。

本批无缺失背景。需要后续接入确认的内容：药窟三解法的热点与结果表现、溪边踏石通路、各场角色比例和遮挡。设计中新必经历练由主聊天处理，不能将候选素材完成视为新门槛或剧情已实现。

未改 src、tests、public、设计文件或旧素材；没有运行代码测试/构建，因为本轮仅新增未引用的候选美术，不把文件检查等同游戏验收。
