# 接流试具独立交付（2026-11-05）

仅新增 `src/golden-story/practices/method/`、两份 method 专属测试及本文；共享命令、TeachingMove、存档版本、迁移与 GoldenStoryScene 接入由主聊天负责。没有提交、推送、修改其他聊天文件。

## 现场与规则

初试是两次操作的短示范：盏中已有旧流，目标为点亮玉环。续试腾空缓冲盏，两条迎面灵流在接点相撞会出现回涌。

- 普通路径：接旧流、引入缓冲盏（旧流接点随之收起）、接新流、放流入环。零物资，零月。
- 已有澄息篇路径：运法、接旧流、接新流、放流。两条接点一直保持，缓冲盏仍空；能力改变连接方式，不是数值加成或省一次点击。
- 相撞不丢失原有接点或存盏成果。开回流槽清除回涌，也可以运澄息篇化去回涌后继续。新流可单独收回；旧流接点可开合。先接新流也可无资源恢复，不需要遵守推荐顺序。
- 放流不足只返回失败，保留局部状态。成功状态 `released` 阻止重复通过；领域不修改外部奖励、年月、种子、资源或故事步骤。
- 没有任何收费动作。重复存盏、空排流、未取得/重复运法、未知动作、损坏材料均返回 error 与零 herbs。

默认 clue 只呈现目标与眼前现象，按钮不拼装答案；结果描述连接、回涌、存盏与玉环变化。没有常驻完整步骤提示。上面的路径仅供接手和测试，`solution` 不参与判定。

## 接口与接入

`index.ts` 导出 `PracticeState`（topic:'method',schema:2）、fresh(step)、valid、upgrade(old,step)、choices 数组、quote(State,string)、view({step,material})、solution(step)。quote 从 goldenStory.practice 读取局部 unknown，返回 error/herbs/next/failed/passed/note；共享命令须沿用原有资格、事件/死亡/地点锁并在保存成功后推进步骤和领悟。

动作：method-left、method-buffer、method-right、method-unhook、method-calm、method-drain、method-release。method-left 是开合动作（已接时收起）；其余动作名称对应 choices。共享 TeachingMove 必须包含这七项。

PracticeScene.vue 接 game/busy，发 move:string。根 pointer-events:auto，可放在 #world。组件自身不绝对定位，最大宽660px，局部试具高度260px；父负责与人物及面板避让。原生按钮支持键盘焦点，不依赖动画/计时器；SVG和对象状态均来自保存数据。组件只发动作，父实际更新 game 后才显示变化。

## 保存与保守升级

字段：left/right 布尔连接、buffer empty/charged、calm 运法状态、backwash 回涌、released 已放流。升级不会通过、授奖或改外部步骤。

- schema2合法材料复制保留；未知/损坏已声明 schema 抛错，交共享迁移拒绝读取。
- 旧 method 的 flow>0保留为已接旧流；旧 joined 且 flow 与该步目标相符时保留为盏中有流且右接点已成，玩家仍须亲手放流。
- 旧未形成有效接点保留已接旧流；缺失旧材料按当前step初始化。全局旧档是否合法、适用哪个版本仍须共享迁移先校验；不能对当前版本坏档调用 upgrade 来静默修复。
- 已完成主题不调用 upgrade、不重开练习、不重发奖励。

## 验证与边界

`npx vitest run tests/method-practice-domain.test.ts tests/method-practice-scene.test.ts`：2文件7项通过。覆盖两步普通/澄息路径差异、失败后换法、32种合法未完成局部状态零物资恢复、报价纯净、旧成果升级、非法schema、重复完成拒绝、组件只发命令、保存后显示、JSON读档回涌、忙碌禁用与未取得法门。

`npx vue-tsc --noEmit`：本目录无错误；当时共享接入的 GoldenStoryScene string→TeachingMove、material-practice optional material 参数和旧 material-practice.test.ts 三种旧材料夹具尚在调整，共5处类型错误。由主聊天完成共享集成后重跑；本轮不能宣布全项目类型检查或构建通过。

未进行真实浏览器1280×720/1920×1080视觉验收、正常新档连续体验、完整角色演出、Windows/Steam验收。组件测试不替代上述验证。
