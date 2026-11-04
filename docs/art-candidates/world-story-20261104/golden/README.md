# B 批：金丹剧情增补背景候选

2026-11-04，状态：candidate。按 docs/narrative-art-brief-20261104.md 制作三张无人环境，3/3 已完成。用途为现有金丹剧情深化及后期衔接，不表示剧情或新场景已实现。

| 场次 | 可引用 WebP | 实际导出尺寸 | 字节 |
| --- | --- | --- | --- |
| G2 潮堤议事 | [tide-dike-council.webp](exports/tide-dike-council.webp) | 1920×1080 | 549298 |
| G4 问法席 | [dao-discussion-terrace.webp](exports/dao-discussion-terrace.webp) | 1920×1080 | 543892 |
| G6 离照丹室 | [lizhao-pill-chamber.webp](exports/lizhao-pill-chamber.webp) | 1920×1080 | 498378 |

目录内容：`originals/` 为三张生成 PNG 原图；`prompts/` 为逐张实际提示词；`sources/` 保存生成来源、参考来源及文件清单摘要；`exports/` 为上表候选；`QA/` 保存 1280×720 检查图及逐张结果。文件名在各目录对应。

使用内置 image_gen，三次独立生成，transparent_background=false。潮堤议事使用本项目先前生成的外海古渡原图作为地理与风格参考，已读取图像；不是覆盖旧图。其余两张无参考图。模型版本、种子未由工具返回，不作推测。来源及完整参数见 [generation-records.json](sources/generation-records.json)。

**原图真实尺寸均为 1672×941，不是原生 1080p。** 原图逐字节保留；居中取 `[4,2,1668,938)` 得到 1664×936 的严格 16:9 画面，LANCZOS 放大到 1920×1080，WebP quality=90、method=6。仅边缘各裁 2–4 像素，不重绘内容。1280×720 QA 图来自实际 WebP 解码后等比缩小，PNG 保存；背景为 RGB、不透明。详情及 SHA-256 见 [manifest.json](sources/manifest.json)。放大不会增加原生细节。

已分别打开三张 1920×1080 WebP 与三张 1280×720 PNG，以原尺寸图像工具检查构图、裁切、物件、地面和出口；不是仅核对文件尺寸。结果见 [逐张 QA](QA/review.md)。三图未见人物、固定宾客、文字、UI、水印或现代西幻设施。未烘焙奖励丹药、阵营胜负或人物生死。图台上的路线线条及炉身装饰不作为可读文字。

素材制作无缺项。尚未完成且不在本次范围：角色叠加、遮挡层、寻路/碰撞区域、交互热点、剧情状态映射、实际 HUD 遮挡、Windows/Steam 验收。背景地面留白不等于可行走机制已完成。

本次只写 `docs/art-candidates/world-story-20261104/golden/`，未改 src、tests、public、设计文件或已有素材，未提交、未推送；无代码变更，因此未运行 npm test/build。未扩张到角色、动画或其他场景。
