# 雾海来信 · v0.9.0

## 可玩范围

旅亭记路后，第三卷入口出现在第二卷操作区。需筑基、完成营救和云路记路；不是另建人物或重置旧档。已收到原山河见闻中父亲亲笔信的角色，开场承认已经找到守灯人，本章追查其护送药队的旧事，不撤销既有结论。

一章闭环：拆信 → 行营商量同行 → 旧药圃或废驿寻证 → 回声阵抉择与挑战 → 旧信真相与探灵灯 → 回坊市分享 → 旧山祠照见避难室，归灯重新亮起。任一支线足够推进；另一处可随时补探，不设置隐蔽永久错失。

## 选择及后果

| 选择 | 解法与变化 |
| --- | --- |
| 旧药圃 | 灵草 4，或医道心得 2，或陆迟同行；救草后得到引灯叶、陈渡护送的证言，把握 +8。 |
| 废驿 | 神识 8 且心得 2，或已相识的成年异性角色协作；获归阵节拍、旧信延迟寄出的线索，把握 +8。 |
| 陆迟同行 | 药圃协作，阵中分工 +12；归来分享后道友信任 +1，上限 6，仅一次。 |
| 沈听澜 / 尹照川同行 | 按既有角色性别与成年相识条件选择；识阵协作，阵中分工 +12；分享后好感 +8，上限 100，仅一次。记忆出现在人物关系页，仍须原有相处才能定情，不自动结婚。 |
| 独行 | 没有同行加成，自己准备知识或药材；可完整通关，充分准备可达 100%。 |
| 先护归路 | 灵石 6、把握 +10、失败不新增伤势；同行者记得约定。 |
| 趁回声追信 | 灵石 3、失败伤势 +1；约好撤退信号，有不同归来对白。 |

首次抵达阵门从状态种子抽取回声 / 风脉阵势，回营、刷新不重抽。回声对应神识至少 8，风脉对应根基至少 12，各给予把握 +10。每次挑战用一次同源 xorshift32 判定，保存当时概率和判定；概率上限 100，没有隐藏必败。

首次失败留阵眼情报，把握 +10；回营以心得至少 2 或执事认可可研究护归法，再 +20，不重复刷取。伤势至少 3 或补给不足禁止挑战，保留全部证据。行营可批量凝神、研读、劳作、养伤；仍走原有月份与待处理剧情规则。

基础把握 20 + 神识×2 + 心得×4 + floor(根基/2) + 证据 / 同行 / 约定 / 阵势 / 情报 / 护归法 − 伤势×5，截断至 5–100。UI 展开显示明细。本章交谈、移动、调查、挑战不推进月份；修行推进真实月份。

## 成长后的变化

探灵灯为本世探索能力，不占战斗灵器槽，不自动提高战力：

1. 得灯前可重访山祠，看见无法辨认的刻痕，但不能照开石墙。
2. 得灯并分享归来经历后，可以照出避难室、拓下护路誓言，场景切换为归灯亮起的新画面。
3. 若先走废驿，之后带灯补探药圃，可照出根脉，不耗草药也不需医道知识。

两条支线的证据、首次探索顺序、阵门约定、同行人、关系结算及旧地变化均持久化。胜利后不能更换这段经历的同行者，避免把同一经历给所有人物重复结算。章节结束后提示回访 / 补探，不再要求重复闯阵。

## 边界与存档

新增 mist.ts 仅依赖纯领域类型和人物常量；UI 只发 mist 命令，不修改状态。任何待处理剧情、社交场景、擂台交锋、死亡、封存状态都禁止本章推进。相同种子和命令序列可重放，重复命令 ID 不重复扣费或领奖。

状态版本 9。v8 原资源、种子、人物关系、章节、阵势和发现全部保留，只补空白第三卷；首次保存备份 original-v8。继续兼容 v1–v7，未来格式拒绝降级覆盖。校验字段类型、范围和阶段前置，非法灯具、无前置的成功 / 回访等状态拒绝读取。轮回 freshAdventure 重置本章；本地 IndexedDB 架构不变。

未实现：新境界、云存档、实时多人、婚礼、配音或环境音。本章是有限内容体验，不宣称已验证长期留存。

## 验证

- npm test：136 项；npm run build、git diff --check。
- 两修行路线 × 三种同行 × 四种子，每组两次公开命令完整重放，包含旧章节准备、筑基、来信、分支、通关、关系、旧地变化及轮回重置。
- 专项覆盖单支线通关、资源与知识门槛、可换路线、重复发现 / 结算、同性别映射至异性角色、未相识拒绝同行、固定阵势、失败后情报与护归法再挑战成功、探灵灯第二用途、冻结状态、v8 迁移与原档备份。
- 浏览器独立端口 5182，使用公开命令生成的检查点，不覆盖 5180 用户进度。390×844 完成废驿与沈听澜同行 → 追信 → 刷新保留 → 入阵扣 3 → 得灯 → 分享 → 山祠新画面 → 补探药圃无草药消耗；360 宽度无横向溢出。不是从零全程手动通关，也不是手机真机认证。

## 素材

内置 imagegen 模式；原图保留在生成目录，工程使用最长边 1536 的 JPEG。沿用 Sites 的本地实现及浏览器验收流程，没有发布到 Sites 托管。

### 药圃：public/scenes/mist-herb-garden.jpg

Use case: stylized-concept. Asset type: Chinese cultivation game environment background. Scene: an abandoned medicinal herb garden terraced on a misty mountain at dawn, low weathered stone walls, small jade-green medicinal plants, one warm lantern beneath a wooden shelter, winding path leading to a distant sealed stone arch. Style: fine Chinese ink and watercolor on textured ivory rice paper, painterly landscape with restrained sage greens and gold light, wistful but inviting. Wide composition with atmosphere and readable middle depth for a game narrative overlay, no people, no text, no logos, no watermark.

### 废驿：public/scenes/mist-courier-station.jpg

Use case: stylized-concept. Asset type: Chinese cultivation game environment background. Scene: an abandoned mountain courier station above a sea of mist at blue dusk, weathered wooden eaves, a broken circular stone formation on the courtyard floor, a single amber lantern, tied bundles of old letters on a sheltered table, distant cloud-filled ravine. Style: detailed Chinese ink and watercolor on textured paper, muted indigo and teal with warm lantern contrast, mysterious and quiet, not horror. Wide establishing composition with visible courtyard and sky, suitable for narrative overlay. No people, no readable writing, no UI, no logos, no watermark.

### 重亮山祠：public/scenes/shrine-relit.jpg

以现有 public/characters/luchi-relic.png 为编辑输入，保留旧山祠建筑风格，去掉前景人物与丹药，显露灯下避难入口；未覆盖原素材。

Use case: precise-object-edit. Asset type: cultivation game restored shrine environment. Use the supplied image as the edit target. Preserve the Chinese ink-watercolor style, weathered mossy stone shrine architecture, carved statues, palette and wide perspective. Remove the foreground man, his sword, the pill and the box entirely. In their place reveal an open stone doorway leading into a small sheltered refuge, with a newly lit warm amber lantern beside the doorway and a faint jade thread of light along the ancient wall carvings. The architectural setting should feel like the same old shrine now rediscovered, quiet, safe and lived-in, no people. Show the stone doorway clearly, no text, no UI, no watermark. Fill the removed subject area coherently with the ancient shrine environment.
