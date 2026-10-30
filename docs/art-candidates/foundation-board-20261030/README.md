# 筑基试剑榜专属人族立绘

2026-10-30。按剧情开发补图需求制作四位独立人物，不使用既有人物换脸或妖兽替代。内置 imagegen 新生成，无图片参考；提示词、生成来源、尺寸、大小及 SHA-256 见 `records/` 与 `manifest.json`，PNG 原图在 `originals/`。

| 人物 | 形象区分 | 正式静态资源路径 |
| --- | --- | --- |
| 罗砺·护舟刀 | 方脸、短须、沉稳护卫、朴素单刀 | public/art/foundation-journey/rank-luoli.webp |
| 周雁回·回风剑 | 高马尾、灰红轻装、回身持剑 | public/art/foundation-journey/rank-zhouyanhui.webp |
| 孟照野·照石阵 | 瘦长脸、灰绿修士衣、石阵盘 | public/art/foundation-journey/rank-mengzhaoye.webp |
| 江问荷·长息诀 | 低髻、米白青绿道袍、空手守势 | public/art/foundation-journey/rank-jiangwenhe.webp |

四张 WebP 均为 512×768，RGBA 且有真实透明像素，共 275,052 字节。最终采用剧情接入 session 导出的 quality 88 版本；本会话未再次覆盖运行文件。静态看图检查人物、道具、四肢与武器边界；最终实际 UI 深浅背景混合边缘及移动端构图仍须由接入 session 复查。

本交付仅新增上述资源、原图与记录；没有修改 src、测试、数值、存档或剧情逻辑。文件进入 public 不等于所有调用已接入。独立素材分支重新验证：341 项测试、生产构建、git diff --check 通过。
