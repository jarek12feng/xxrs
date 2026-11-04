# 问法与结契场景素材交接

日期：2026-11-04。使用内置 imagegen 实际生成，Pillow 仅用于所要求的尺寸转换、WebP 导出和缩略图检查。

本聊天只新增 `public/art/important-scenes/` 与本目录文件，未修改规则、UI 或其他文档，未提交、推送。以下为待接入素材，文件存在不代表场景已接入或游戏验收。

## 最终交付

| 文件（位于 public/art/important-scenes/） | 原图实际尺寸 | 导出尺寸 | 用途 |
| --- | --- | --- | --- |
| dao-demonstration.webp | 1672×941 | 1920×1080 RGB | 古渡临海问法席，左侧低讲席、石案药盏、浅槽引水与流纹，中央演法空地 |
| covenant-courtyard.webp | 1672×941 | 1920×1080 RGB | 古渡近旁傍晚暖灯院落，中央双人行礼空地、后方小桌和岸边远景 |
| covenant-keepsakes.webp | 1254×1254 | 512×512 RGBA | 透明配对旧图与灰蓝、素白系绳信物 |

两张背景由原生 1672×941 图像以 Lanczos 放大并极轻微居中适配至严格 16:9；不是原生 1920×1080 生成。原始 PNG 完整保留，不覆盖生成源。信物保留原始透明通道后缩小。

## 来源与提示词

生成前实际查看了项目参考 `public/art/world-story/golden/dao-discussion-terrace.webp` 和 `public/art/foundation-growth/meridian-retreat.webp`，用于木石材质、海岸松影和克制流纹的风格对齐。首次生成通过文字描述参考特征；石案修正调用以问法初稿 PNG 为明确编辑输入。

完整提示词见 [prompts.md](prompts.md)，生成源绝对路径、尺寸、文件字节数及透明检测见 [manifest.json](manifest.json)。问法初稿木案与最终石案都保存，交付使用石案版本。

原图清单：

- `originals/dao-demonstration.png`：最终石案版。
- `originals/dao-demonstration-draft.png`：未采用木案初稿，1672×941。
- `originals/covenant-courtyard.png`。
- `originals/covenant-keepsakes.png`。

## 实际检查

已查看全部生成全图与以下实际缩略图：

- `QA/dao-demonstration-480.png`：480×270，左右建筑与水槽可辨，中央约 x45–65% 的地面开阔，无人物、文字或西式符号。药盏在此尺寸很小，不承担独立操作图标用途。
- `QA/covenant-courtyard-480.png`：480×270，暖灯、后方小桌与远岸清楚；中央小桌前保留双人站位，未做宫廷大婚装饰。两侧建筑细节较多，操作面板仍需接入时验证对比度。
- `QA/covenant-keepsakes-light-dark.png`：600×240 检查板，分别以 96px、160px 显示于浅底和深底。配对旧图、系绳及山岸轮廓可辨，无戒指、红心或菜单边框。

信物 alpha 范围 0–255；512px 导出最外沿最大 alpha 为 1/255，存在极轻的近透明边缘像素，深浅底肉眼检查未见实体底框。未人为删改生成透明边缘。

## 接入边界

背景已留出人物站位，但尚未叠加游戏角色、操作热点或面板，也未验证真实 UI 遮挡、点击范围和桌面窗口缩放。人物由已有角色素材叠加，背景自身无人物。本次不运行应用测试或构建，不声称浏览器、Windows、Steam 或真人试玩验收。范围内 `git diff --check` 已通过；后续由父线程读取文件完成接入。
