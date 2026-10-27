# 航图之外 v0.7.0

## 本轮体验目标

不是再加一串升级按钮，而是让已有修行为具体的路与人服务：营救后有人记得你，坊市有人愿意合作，山口有暂时过不去的危险，准备后能走到新的地方，归来时世界有回应。

实际闭环：第一卷救药工 → 回访温蘅/药工（按营救方式回应）→ 认识行脚人郁青 → 接下伤药委托 → 交灵草 4 或用神识 6、心得 2 辨药 → 补图 → 青嶂关观察 → 回行营准备 → 筑基后挑战 → 云外长路 → 云栈旅亭记路 → 回坊市听回应。记路一次奖励灵石 8，打通后的往返免费。

## 规则与边界

- road.ts 仅以 type 导入 State，规则不依赖 Vue、Pinia、浏览器、时间或系统随机数。world.ts 接收 road 命令；adventure.road 保存进度，轮回重置。所有原有规则继续使用既有命令。
- 交谈/移动不推进月份；每次有效闯关消耗灵石 4、不推进月份。普通修炼仍推进真实月份，遇待决事件暂停；闭关跨过陆迟约期仍必须在 UI 二次确认。
- 首次观察用状态 RNG 确定迷雾/罡风，无法通过反复观察刷新。挑战另掷 1–100，不高于当前把握即成功。无效命令不扣资源、不改种子、不记录命令 ID。
- 必须先筑基，伤势不能超过 2。功法路线要求实际装配任意功法；灵器路线要求实际装配；同行路线要求郁青已应约。选择标签本身不算完成准备。
- 把握 = 基础 14 + 根骨整除 2 + 神识 ×2 + 根基 + 心得 ×4 + 所选准备 + 对应危险准备 − 伤势 ×8，限制 5–100。功法/同行 +20，灵器按等级与灵瓶加成。迷雾神识 8 或罡风根基 12 额外 +5。三条路线均能通过真实命令准备至 100%。这不改变原有筑基 95% 上限。
- 失败增加 1 伤势，保留航图、装备、同行约定；可养伤、提升神识/根基/心得，或更换方向，不强迫无上限重复随机尝试。
- 郁青是道友，不是新增恋爱对象；青嶂是守境妖修，不是纯粹反派。两位暂用姓名印记，未伪称已有独立立绘。
- 第二卷云外长路独立于原有回春谷/雾岭/雾海进度，不能绕过原有地图条件。本轮不新增金丹、婚礼、在线排行榜、后端数据库或 Steam/TapTap 安装包。

## 统一场景规范

SceneBackdrop.vue 承载场景背景、地点、环境叙事、人物肖像/姓名与对白，以及最新剧情反馈。文字在暗色渐变遮罩上自然排版，长段落增加场景高度，不绝对定位裁掉正文。scene.css 定义统一样式并尊重减少动画偏好。

场景下方是明确标注的浅色 scene-controls 操作区：目标、资源条件、按钮、装备、胜率等功能信息与叙事分开。现已覆盖第一/第二卷、洞府、三处旧地图、宗门师承、人物缘分、擂台、功法、灵器、修行安排、剧情弹窗、突破与轮回。说明、导入确认等系统对话框保留普通表单，历史日志保留可检索文字结构。

手机功能导航改为可完整展开的三列网格，并解除上层通用 nav 的固定高度，避免后几项被场景盖住。剧情按钮至少 44px 高，移动端单列，不做悬浮按钮遮挡正文。资产风格仍有复用，后续可逐步为每个地点补专属插画，不以“已配背景”等同于完成美术制作。

## 存档

状态版本 7；v6 的冒险步骤、旧约、资源、种子、世界和人物关系全部保留，只补 freshRoad。已救回药工者进入第二卷回访；未完成者继续原位置。v1–v5 继续原有迁移。首次写入保存 original-v6；未来版本拒绝读取/覆盖，非法 road 状态拒绝保存。单机 IndexedDB 保留 current/previous，刷新恢复，不支持跨来源共享或防回档。

## 验证

104 项测试：新增第二卷无效命令冻结、资源/资格门槛、两种补图办法、固定种子风险、失败保留进度、实际装备与援助门槛、一次性奖励、免费重访、迁移原档保护、非法状态拒绝、轮回重置。三种准备方向 × 十个种子，每组真实命令从零跑至通关并重放比对。原有章节、世界、关系、擂台测试保留。

场景渲染测试覆盖长正文不丢失、正文和按钮分区、四类主要面板及三处旧地图独立背景。npm test、npm run build、git diff --check 为提交门槛。

浏览器在独立 5180 来源验收，不改 5173 用户进度：手动完成开篇营救、回访、坊市委托、补图、观察险阻、同行准备，修炼在第三月剧情暂停，刷新保留场景与危险。随后通过正常导入入口载入 tools/road-preview.ts 用 43 条真实命令生成的筑基准备档，完成过关、旅亭记路、坊市回应、免费重访，并刷新确认。不是宣称浏览器全程手动从零筑基。

在 360px 视口检查人物初逢弹窗、提交选项和各功能页场景/操作区；另外检查 390/430px 竖屏和 844×390 横屏。未做移动真机或长期留存验证。

开发检查点生成方式（输出路径必须尚不存在，避免覆盖）：

```sh
npx esbuild tools/road-preview.ts --bundle --platform=node --format=esm --outfile=/tmp/xxrs-road-preview.mjs
node /tmp/xxrs-road-preview.mjs /tmp/xxrs-road-checkpoint.json
```

## 本轮场景素材

内置 imagegen，generate 模式，无参考图片、不透明背景；保留原始生成文件，将结果转成 JPEG 78 品质以控制加载体积。最终资源：public/scenes/mountain-market.jpg（坊市），public/scenes/cloud-frontier.jpg（云外长路/旅亭）。其余场景复用项目现有本地插画。

坊市提示词：

> Use case: stylized-concept. Asset: environment background for a Chinese cultivation adventure game. Mountain town market at late afternoon, narrow stone street, modest wooden shops, herb stall with baskets and rolled maps, hanging warm lanterns, tiny distant robed travelers. Hand-painted Chinese ink and fine watercolor on ivory rice paper, muted sage, ochre and amber, richly detailed but calm. Wide landscape with central street and map stall readable under portrait mobile cropping. No legible writing, no logos, no watermark, no foreground portrait. A lived-in place to meet people and discover rumors.

云路提示词：

> Use case: stylized-concept. Asset: environment background revealing a new region in a Chinese cultivation adventure. View beyond an ancient mountain pass onto an enormous sea of clouds, distant hanging cliff settlements, waterfalls flowing into mist, a winding elevated stone path toward a small traveler's pavilion in the central distance. Sunrise breaking through deep blue-green peaks. Fine Chinese ink and watercolor on ivory rice paper, grounded painterly detail, awe and possibility rather than war. Wide landscape, central gateway and distant pavilion remain clear in portrait mobile crop. No text, no logos, no watermark, no foreground people.
