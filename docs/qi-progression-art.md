# 炼气中后期成长素材交接

2026-11-02。状态：四张原创 AI 素材已生成、检查并导出；本 session 未接入规则或 UI，未提交、未推送。素材存在不表示相应关卡、材料或成长重构已经实现。

## 使用文件

文件均位于 `public/art/qi-progression/`，浏览器资源路径以 `/art/qi-progression/` 开头。

| 文件 | 用途 | 原图尺寸 | 交付尺寸 | 文件字节数 |
| --- | --- | --- | --- | --- |
| `medicine-valley-spring.webp` | 药谷淬脉泉：无人山谷药泉，涌流、湿滑石径与临崖落差表现危险 | 1672×941 | 1280×720 | 230128 |
| `qingshi-inner-platform.webp` | 青石遗府内层凝元石台：石台阵纹与石质守阵傀儡 | 1672×941 | 1280×720 | 194202 |
| `dew-herb.webp` | 凝露草：完整根茎叶，竹编药盘收纳 | 1254×1254 | 192×192，透明 | 12746 |
| `condensed-essence.webp` | 凝元晶髓：乳白矿髓与浅青内脉，丝衬中式木匣收纳 | 1254×1254 | 192×192，透明 | 10708 |

四个运行时 WebP 共 447784 字节（约 437 KiB）。场景不透明，道具保留 alpha。尺寸以实际生成文件为准，工具未完全遵循提示词中的尺寸请求。

建议两张场景保持 16:9 完整显示。遗府护法位于左上，强行居中裁成窄竖图会裁掉护法，需接入方按实际布局复核。正文和按钮置于独立实色区域，不直接叠在复杂岩石纹理上。道具用 contain，配独立名称；不从图片推断稀有度、数量、获得状态或材料效果。

## 来源与制作记录

- 工具：内置 `image_gen.imagegen`；每个素材单独调用一次。未使用 CLI/API 后备流程。
- 原创提示词，没有上传第三方图片；阅读并目视核对了项目已有 `inheritance-room.webp` 与 `herbs.webp` 的风格，但没有将其作为图片输入或修改它们。
- 制作依据：AGENTS.md、成长循环统一约束、主线总纲、第一卷、后续剧情目录、中国修真美术设定。本轮明确授权的凝露草、凝元晶髓优先于旧美术文档中“仅有通用灵草”的历史范围；这仅授权素材，不新增规则。
- 全部实际提示词：[`source/prompts.json`](qi-progression-art/source/prompts.json)。key 对应：spring→药泉，platform→石台，herb→凝露草，marrow→凝元晶髓。
- 未修改生成原图内容。通过 cwebp 缩放与编码，场景 `-q 84 -m 6 -resize 1280 720`，道具 `-q 88 -m 6 -alpha_q 100 -resize 192 192`。原场景宽高比与 16:9 的微小差异仅由缩放统一。
- 原图均复制存档到 `source/` 下的同名 PNG；默认生成目录原文件保留。

| 原图 | 默认生成文件名 |
| --- | --- |
| `source/medicine-valley-spring.png` | `exec-c6157bdd-eb06-43bb-a98e-0d4793291de3.png` |
| `source/qingshi-inner-platform.png` | `exec-7f2c0eb1-c257-42c5-b5df-39a661266e5c.png` |
| `source/dew-herb.png` | `exec-4cb29dd7-9f3d-49c9-aec2-bb53943503fc.png` |
| `source/condensed-essence.png` | `exec-35f79aab-5753-43eb-9f8a-b6a77f61c129.png` |

默认生成目录：`/Users/admin/.codex/generated_images/01a19a21-de43-78b0-b98e-a4b048cb20d6/`。

独立素材 session 最初将制作证据保存在指定 public 目录；主 session 接入时已将 `source/` 与 `qa/` 迁到 `docs/qi-progression-art/`。运行包只包含四张 WebP。

## 检查结果与边界

- 逐张查看原图与导出场景：药泉无人；遗府守卫是完整石雕护法，具石甲、石剑和阵盘，不是机器人或人物替身；阵纹为几何刻槽。
- 四张图目视未见文字、伪字、现代器件、西式药水瓶、品质标记或水印。场景不额外设定具名 NPC、事件结果与资源掉落。
- `sips` 确认两个原图及 WebP 道具均有 alpha；查看输出时没有实体黑框。
- `qa/` 保留两道具分别为 48px、64px 的无损缩略图。目视可区分竹盘植物和木匣矿髓；48px 时露珠、叶脉、矿髓内纹不能承担玩法提示，名称和说明应由 UI 提供。
- 已检查压缩后的两张 1280×720 场景，主要空间、药泉涌流、石台阵纹与守卫轮廓仍清楚。
- 仅静态素材验收，未做游戏入口接入、移动端裁切、真实设备或玩家验收；未运行规则测试及构建（没有规则/UI 变更，且本轮不提交）。
- 本 session 新增范围仅为本文件与 `public/art/qi-progression/`，保留并行工作区现有改动。


主 session 接入补记：运行时仅保留四张 WebP；制作原图、提示词与检查图已迁到 docs/qi-progression-art/source 和 qa，避免随 public 打包。场景与材料已接入炼气历练面板。
