# 男主两境衣装与动作接入

2026-11-02。已在本地实现；未提交、未推送。

## 玩家可见变化

- 炼气：青绿、米白素衣，布腰带、护腕与布靴；筑基：沿用原来的叶纹衣装和玉饰。同一张既有男主立绘作为所有新增素材的身份参考。
- 两套衣装均有站立、打坐、出剑、护身/施术、受击五种姿态。新增七张，筑基站立、打坐、出剑复用原有三张，不覆盖旧文件。
- 洞府修行按当前境界自动切换衣装；吐纳与凝神继续使用打坐。现有研读、养伤仍共用静坐，采药与劳作仍用站立，本轮未声称有这些动作专图。
- 旧阵战斗：strike→出剑，guard/discern→护身手诀，hurt/loss→受击，其余站立。姿态读取已有结算 effect，不按敌人预告假造受击。
- 炼气秘境、准备路线共用的交锋和筑基交锋新增主角图，按已有 duel.effect 展示出剑或手诀；没有 hurt effect 的战斗不会凭空推算受击。
- 炼气擂台读取境界衣装，等待出招显示站立；该擂台没有复用旧阵 effect 的动作结算字段，未伪称具备逐招演出。
- 女主素材保持原样，未支持的新姿态沿用已有站立回退。
- 衣装仅依赖 realm 的只读映射，不新增衣柜、装备属性、存档字段、规则或随机数调用。

## 素材与来源

新增运行图目录：`public/art/hero-male/`。全部为 480×720 透明 WebP，共 664416 字节（约 649 KiB）。

| 文件 | 用途 |
| --- | --- |
| qi-idle.webp | 炼气站立 |
| qi-meditate.webp | 炼气打坐 |
| qi-attack.webp | 炼气出剑 |
| qi-guard.webp | 炼气护身/施术 |
| qi-hurt.webp | 炼气受击 |
| foundation-guard.webp | 筑基护身/施术 |
| foundation-hurt.webp | 筑基受击 |

筑基复用：`public/art/characters/hero-male.webp`、`hero-male-meditate.webp`、`hero-male-attack.webp`。

使用内置 imagegen，每张分别编辑生成，参考图为项目既有 `public/art/characters/hero-male.webp`。原图保存在 [source](hero-male-art/source/)，完整提示词见 [prompts.json](hero-male-art/source/prompts.json)。生成输出为 1024×1536 RGBA，cwebp 按 `-q 86 -m 6 -alpha_q 100 -resize 480 720` 导出。没有使用命令行模型后备，也没有手工替换背景。

工具预览曾显示原图 RGB 中的背景光晕；实际 alpha 检查及浏览器浅深背景合成确认透明，运行图没有矩形底色。图片不是连续帧或骨骼动画。

默认生成目录：`/Users/admin/.codex/generated_images/01a19a21-de43-78b0-b98e-a4b048cb20d6/`。
- qi-idle: `exec-0c16be85-0b0e-408e-90ce-e0d79538e658.png`
- qi-meditate: `exec-6e312bc7-708d-4bc5-97d2-954b3a10d382.png`
- qi-attack: `exec-eb1dd9e8-309e-427c-bfbe-6feb45c3d4ad.png`
- qi-guard: `exec-b5ddf220-705f-4607-b8f8-6136117ad63d.png`
- qi-hurt: `exec-c2633372-1cc6-4210-899d-122dd08c8766.png`
- foundation-guard: `exec-62af9852-3015-4129-b8e3-2916702ea702.png`
- foundation-hurt: `exec-81801aa0-0d0b-4464-abb8-65454b504ff6.png`

## 接入与验证

- 映射：`src/presentation/art.ts`；修行：`PracticeStage.vue`；旧阵：`expedition/BattleStage.vue` 与父组件；擂台：`SocialPanel.vue`；秘境：`qi-journey/QiJourneyPanel.vue`；筑基：`foundation-journey/FoundationPanel.vue`。
- 单独可重放验收页：`tools/hero-art-preview.html`，使用真实组件与独立测试数据，不读取或修改用户存档，可切换两套衣装。
- 新增 `tests/hero-art.test.ts`：两境五姿态资源存在、女主回退、资源预算、修行和战斗真实组件 SSR、读取结算效果且不修改输入。
- 最终全工作区 `npm test`：71 个文件、557 项通过；其中包含其他 session 并行工作，不全部归属于本轮。
- `npm run build` 通过，仍有主 JS 超过 500 kB 的构建提示；`git diff --check` 通过。旧路径测试首次失败后，核对发现已被并行 session 更新，本轮未重复改写。
- 使用本机 Chrome 无头浏览器检查 1200px 与 390px，未发现破图、脚本错误或横向溢出。目视检查浅/深底姿态与修行、战斗画面；炼气秘境原浮动插画会干扰气势条，已改成独立并排图像区，数值和说明在下方完整展示。
- QA 截图：[炼气姿态](hero-male-art/qa/qi-poses.png)、[筑基姿态](hero-male-art/qa/foundation-poses.png)、[筑基窄屏](hero-male-art/qa/foundation-mobile.png)、[秘境窄屏](hero-male-art/qa/qi-combat-mobile.png)、[筑基交锋窄屏](hero-male-art/qa/foundation-combat-mobile.png)。
- 本轮为表现层开发验证，不代表真人首玩、手机实机、所有状态/构筑或长期成长体验验收。原图和 QA 放在 docs，public 仅放运行图。
