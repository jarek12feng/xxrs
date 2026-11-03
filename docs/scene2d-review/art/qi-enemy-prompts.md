# 炼气敌人场内素材

2026-11-03，内置 imagegen，逐张以 public/art/qi-people-beasts/ 下同名 WebP 为编辑目标生成透明版，保留原文件。仅修改表现引用，不改敌人规则身份。

| 运行素材（public/art/scene2d/） | 尺寸 | 原始生成文件 |
| --- | --- | --- |
| redback-badger-v1.png | 1536×1024 | exec-fd9de8e7-c4f0-4843-b5c3-4b5bf045f474.png |
| spring-python-v1.png | 1448×1086 | exec-88520d08-cd83-4530-9ac5-da864d9ea96b.png |
| corridor-guardian-v1.png | 1199×1312 | exec-f61add2b-6e32-48d8-b4b5-e0e47e281dc3.png |
| platform-guardian-v1.png | 1536×1024 | exec-e633f74a-8bb1-4fbf-8c3f-f9ce9cfb7d8d.png |

生成文件父目录：/Users/admin/.codex/generated_images/01a19bf4-3a30-7b70-98bf-92383c10f7d2/。全部已原样复制到项目。RGBA 背景抽查 alpha 0，岩獾角点 alpha 1；四种敌人均在1280×720实际场景查看，未出现原来的背景矩形。不是攻击序列帧，击退反馈由表现层位移和亮度呈现。素材加载失败仍保留敌名、气势和操作。

四次调用均使用以下完整提示词；transparent_background=true，每次只传对应原始敌人插画：

```text
Background extraction for a Chinese cultivation 2D game. Edit target is the provided creature illustration. Preserve the exact creature identity, materials, colors and painterly style. Isolate the whole creature only, filling in any feet or tail hidden by ground/water if necessary. Center entire creature within image with generous transparent padding, no cropping. Remove every bit of scenery, ground, water, rocks, haze, shadow and environment. Real alpha=0 fully transparent background outside the creature, not white or checkerboard, no text. Creature must face LEFT toward the player (mirror facing direction if needed), three-quarter side view. Production game cutout.
```
