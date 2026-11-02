# 炼气人物与妖兽素材交接

2026-11-02。六张独立素材已通过内置 imagegen 生成并压缩。此 session 仅制作素材，不修改 src/tests，不提交或推送。主 session 负责接入；本文不将素材交付等同于游戏内展示验收。

## 运行时文件

目录：`public/art/qi-people-beasts/`。均为不透明 WebP；共 587360 字节，约 574 KiB。

| 文件 | 对象与用途 | 生成原图 | 运行图 | 字节 |
| --- | --- | --- | --- | --- |
| xu-zhaolan.webp | 许照岚，32 岁成年采药女修；青褐粗布衣、药篓、冷静观察神态；人物半身肖像 | 1086×1448 | 576×768（3:4） | 105938 |
| pei-zhu.webp | 裴铸，46 岁成年修器男匠；粗布衣护腕、小锤和石质阵盘；人物半身肖像 | 1086×1448 | 576×768（3:4） | 75962 |
| redback-badger.webp | 赤背岩獾；短肢低伏壮实体态、黑白獾面、赭红片岩背甲 | 1448×1086 | 768×576（4:3） | 110284 |
| spring-python.webp | 护泉青鳞蟒；自然蟒首、盘曲长身、浅泉和草丛 | 1448×1086 | 768×576（4:3） | 137260 |
| corridor-guardian.webp | 巡廊石傀；窄身直立、长重臂、迈步姿势和回廊阵纹 | 1448×1086 | 768×576（4:3） | 72312 |
| platform-guardian.webp | 凝元守台傀儡；宽厚短腿、层叠石甲、胸口圆形石阵核与石台 | 1448×1086 | 768×576（4:3） | 85604 |

URL 为 `/art/qi-people-beasts/<文件名>`。人物是有背景的半身画像，不是全身透明立绘；许照岚下方手指随半身取景靠近画面边缘，不适合冒充全身动作图。敌图建议保持完整 4:3，不进一步紧裁；特别是巡廊石傀需保留迈步和双臂形态。

## 制作与来源

读取本轮指定的 `docs/art-direction.md`、`docs/progression-loop-contract.md`、`docs/mainline.md`。本轮六个新对象依照明确授权制作，不从图片增加任务、战斗能力、数值或人物关系；许照岚不是温蘅，不增加道侣暗示。

- 使用内置 `image_gen.imagegen`，每个对象单独一条原创提示词，各生成一次；无第三方图像输入，无 CLI/API 后备流程。
- 全部实际提示词：[source/prompts.json](qi-people-beasts-art/source/prompts.json)。key 与文件名相同。
- 原始 PNG 原样复制至 `docs/qi-people-beasts-art/source/<同名>.png`；默认生成目录原件保留。
- 默认生成目录：`/Users/admin/.codex/generated_images/01a19a21-de43-78b0-b98e-a4b048cb20d6/`。
- 实际原图尺寸由工具返回，不以提示词请求尺寸冒充实际尺寸。
- 运行时编码：`cwebp -q 84 -m 6 -resize 576 768`（人物）或 `-resize 768 576`（敌图）。仅等比例缩放和编码，无重绘、抠图或裁切。
- QA 缩略图由运行时 WebP 用 cwebp 无损编码生成，长边 96 与 192；文件位于 `docs/qi-people-beasts-art/qa/`。制作原图和 QA 不进入 public 目录。

| 对象 | 默认生成源文件 |
| --- | --- |
| xu-zhaolan | exec-9349b962-4055-4904-9da7-3ef2cb418de0.png |
| pei-zhu | exec-6c25401c-1ac1-45ee-ad60-e9eaa50667ed.png |
| redback-badger | exec-25f46373-92f1-497f-967a-9133dd48d4ff.png |
| spring-python | exec-5afc4189-f611-49af-882b-a972de81e314.png |
| corridor-guardian | exec-e9b767a2-8330-4f13-b2d3-6cd2cf7e915a.png |
| platform-guardian | exec-ce3c2a90-a306-4db9-9a88-bbbe95984de5.png |

## 静态验收

- 逐张目视检查生成图和六张压缩运行图；未见文字、水印、数值标签、现代工具、西式奇幻器物或巨大水晶核心。
- 两位 NPC 以真实人面、布衣、发髻和职业器物辨识；妖兽保留獾/蟒动物结构，没有人脸或额外怪物肢体；石傀全身为风化石材，未采用活人皮肤或科技管线。
- 两种石傀在 96px 长边检查中仍能凭“高瘦迈步”与“宽厚立定、胸口圆盘”区分。石傀细部石缝在小图会减少，名称仍应配合显示。
- 96px 长边时，獾面、低伏背甲与蛇身 S 形轮廓可区分；人物药篓与工坊阵盘方向可区分，精确年龄与人物身份需由文本表达，不能靠图像保证。
- 所有原图的尺寸和无 alpha 状态经 sips 核查。运行时总大小通过文件字节统计核查；`git diff --check` 通过。
- 尚未做游戏实际入口、移动端裁切或真实设备验收。没有代码改动，也不提交，因此未在此 session 重跑规则测试及构建。
- 本次新增仅限 `public/art/qi-people-beasts/`、本文与 `docs/qi-people-beasts-art/`；其他并行改动保留。
