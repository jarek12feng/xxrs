# 沈观微本人在场与晚年讲录验证

2026-11-04。父任务发现V2遗漏后，A补独立人物并接入。先告知C，只制作素材；C确认首轮完整测试已结束、开放接入窗口后才修改src/tests。未提交推送、不读写5334存档。

## 实现

- `teachingSpeaker`暴露只读present标志，热点、开场词与形象共用年月条件。
- `GoldenStoryScene`进一步检查实际realm=2、court、introduced及conclave场景；合法时显示独立沈观微全身素材与对应热点，晚年/公开实录不显示她。
- 两步亲习、错误可重试、完成后授法原逻辑未改。人物轮廓光读取practice/step；不由演出结算规则。因1280面板遮到原主角，略缩小并左移演法主角，复验全身可见。
- 单姿态人物加状态光，未宣称完整人物动作或逐帧演出。晚年当值传讲人仍为具名热点，没有新增未经设定的具体身份图。

## 素材交付

独立目录：`docs/art-candidates/review-fixes-shen-guanwei-20261104/`，包含原图、完整prompt、实际尺寸/alpha/哈希manifest及浅深底450px QA。运行资源：`public/art/review-fixes/shen-guanwei-teaching-v1.webp`，768×1152 RGBA WebP。不是借用其他NPC。

## 真实条件与浏览器证据

`checkpoints.ts`由conclaveCheckpoint起，经公共命令等候会期、赴会、相识得到早期状态，再离会、按月劳作至晚年并回会谷。无直接修改年龄、境界、资源或完成旗标，每命令由goldenCompletionPlayer检查validState、确定性重放与保存恢复。

独立端口5388、独立headless Chrome上下文，不连接用户浏览器或IndexedDB。`browser-audit.mjs`在1920×1080和1280×720分别实际点击问法热点、接续之法、缓下旧脉、候新流回转，四组均完成method教学，pageerror为0。截图拍在初试阶段：

| 状态 | 月份（开始亲习后） | 人物 | 证据 |
| --- | --- | --- | --- |
| 本人在场 | 2070 | 沈观微全身图1张，加载成功，问法热点同名 | present-1920.png / present-1280.png |
| 晚年讲录 | 2404 | 沈观微图0张，热点/回执均为当值传讲人 | record-1920.png / record-1280.png |

`observations.json`保存实际视口、月份、境界、位置、introduced、practice、界面文本和人物数量。服务禁用HMR，站位修订后停止并重启服务，重新执行四组，最终截图对应最终代码。

## 自动验证与边界

7文件43项专项通过（tests.log），包括新golden-teacher-presence的两种公共命令条件及既有亲习/结契/伙伴测试。首次构建发现新测试未使用State导入，移除后重跑；最终build.log记录结果。最终整库test/build由C在A/B停止写入后统一执行，此处不替代其结果。

这是公共命令检查点的真实组件浏览器验证，不是完整App HUD、正常新档连续手动试玩、陌生玩家或Windows/Steam验收。

最终`npm run build`通过，`git diff --check`通过。A已停止src/tests写入并通知C开始最终共享版本验证。
