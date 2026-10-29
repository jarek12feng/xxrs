# 素材候选 V1

日期：2026-10-29。34 张独立 PNG：15 张角色/姿态、19 张道具。本目录保留制作原图；已派生压缩资源接入开发版，见 [接入记录](../../art-integration.md)。

[打开深浅背景预览及 64px 图标](gallery.html) · [原始提示词、参考图和校验信息](source-manifest.json)

## 功法载体

书册：长春诀、听松剑经、归元息、辨草录。玉简：护身诀、照夜篇。两者并存；载体不隐含品质、获取方式或规则变更。

## 素材清单

| 名称 | 原图 | 尺寸 |
| --- | --- | --- |
| 男主角·待机 | [hero-male](characters/hero-male.png) | 1024 × 1536 |
| 女主角·待机 | [hero-female](characters/hero-female.png) | 1024 × 1536 |
| 陆迟·待机 | [luchi](characters/luchi.png) | 1024 × 1536 |
| 郁青·待机 | [yuqing](characters/yuqing.png) | 1024 × 1536 |
| 青嶂·待机 | [qingzhang](characters/qingzhang.png) | 1024 × 1536 |
| 劫药客·待机 | [raider](characters/raider.png) | 1024 × 1536 |
| 蚀阵傀儡·待机 | [golem](characters/golem.png) | 1024 × 1536 |
| 灵石 | [spirit-stone](items/spirit-stone.png) | 1254 × 1254 |
| 灵草 | [herbs](items/herbs.png) | 1254 × 1254 |
| 筑基丹 | [foundation-pill](items/foundation-pill.png) | 1254 × 1254 |
| 回春散 | [healing-powder](items/healing-powder.png) | 1254 × 1254 |
| 清心丹 | [clarity-pill](items/clarity-pill.png) | 1254 × 1254 |
| 听松灵剑·一阶 | [sword](items/sword.png) | 1254 × 1254 |
| 归元灵瓶·一阶 | [vial](items/vial.png) | 1254 × 1254 |
| 长春诀 | [manual-spring](items/manual-spring.png) | 1254 × 1254 |
| 听松剑经 | [manual-blade](items/manual-blade.png) | 1254 × 1254 |
| 归元息 | [manual-breath](items/manual-breath.png) | 1254 × 1254 |
| 辨草录 | [manual-herb](items/manual-herb.png) | 1254 × 1254 |
| 护身诀·玉简 | [manual-guard](items/manual-guard.png) | 1254 × 1254 |
| 照夜篇·玉简 | [manual-lantern](items/manual-lantern.png) | 1254 × 1254 |
| 航图 | [route-map](items/route-map.png) | 1254 × 1254 |
| 药签 | [medicine-tag](items/medicine-tag.png) | 1254 × 1254 |
| 家书 | [family-letter](items/family-letter.png) | 1254 × 1254 |
| 探灵灯 | [spirit-lantern](items/spirit-lantern.png) | 1254 × 1254 |
| 男主角·吐纳 | [hero-male-meditate](characters/hero-male-meditate.png) | 1024 × 1536 |
| 男主角·出剑 | [hero-male-attack](characters/hero-male-attack.png) | 1024 × 1536 |
| 女主角·吐纳 | [hero-female-meditate](characters/hero-female-meditate.png) | 1024 × 1536 |
| 女主角·出剑 | [hero-female-attack](characters/hero-female-attack.png) | 1024 × 1536 |
| 劫药客·蓄力攻击 | [raider-attack](characters/raider-attack.png) | 1024 × 1536 |
| 劫药客·受击 | [raider-hurt](characters/raider-hurt.png) | 1024 × 1536 |
| 蚀阵傀儡·蓄力攻击 | [golem-attack](characters/golem-attack.png) | 1024 × 1536 |
| 蚀阵傀儡·受击 | [golem-hurt](characters/golem-hurt.png) | 1024 × 1536 |
| 听松灵剑·精炼 | [sword-refined](items/sword-refined.png) | 1254 × 1254 |
| 归元灵瓶·精炼 | [vial-refined](items/vial-refined.png) | 1254 × 1254 |

## 检查与剩余工作

- 所有 PNG 已读取校验，具有 alpha 通道；原图按角色与道具分目录保存。生成工具为 image_gen，逐图提示词、身份参考、原始输出路径与 SHA-256 记录在 source-manifest.json。
- 角色存在较宽的半透明光晕；吐纳姿态横向留白偏少，部分战斗姿态贴近边缘。接入前需要清理边缘、统一画布占比和脚底锚点，不能把这些原图直接当成已验收动画精灵。
- 本轮覆盖男女主角待机/吐纳/出剑，三个配角待机，两类敌人待机/蓄力/受击；主角受击、敌人败退和独立剑气/阵核特效尚未完成。
- 书册用轮廓、装帧与纹样区分，名称由 UI 渲染；小图仍需在真实背包/奖励界面做辨识测试。
- 精炼图仅展示形态方向，不承诺具体阶数映射；最终应从现有规则读取阶段。
- 当前是高分辨率制作母版，不应全量进入首屏。接入时导出实际显示尺寸的压缩资源、按场景加载，并验证低动态模式。
- 此次仅新增美术文件与说明，未修改功能、数值或存档；未执行运行版测试，不以素材检查替代发布验收。
- 核对原 A 版清单的 134 个文件时，发现当前工作区的 `src/App.vue`、`src/action-sound.ts`、`src/audio.ts`、`src/local-music.ts`、`src/sound-cues.ts`、`tests/opening-ui.test.ts` 已与冻结摘要不同；本轮未修改这些文件，也未更新冻结摘要或覆盖试玩包。当前工作区不能直接等同于原冻结包。
