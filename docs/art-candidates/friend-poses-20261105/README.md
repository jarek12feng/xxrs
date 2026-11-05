# 苏婉宁探望五姿态 · 2026-11-05

使用内置 image_gen，参考 public/art/companionship/shentinglan-work.webp 保持人物身份。输出为单张透明 PNG 图集，不是五份独立新角色。无 CLI/API 回退。

- 首版：draft.png，存在明显外围雾状杂边，弃用。
- 二次清理原始输出暨运行时资产：public/art/friend-journey/su-visit-poses-v1.png（仓库根目录相对路径），2172×724，带 alpha，约1.5MB。原文件另保留于生成目录 exec-2a82a711-472e-4dbe-bac1-475f2e9b171d.png；接入不依赖该外部目录。
- 顺序：抬头持卷、双手展图、指图、收卷、护臂。面容、编发、灰蓝衣裙及靴子延续旧图；双手和测记改为实际画入。
- src/friend-journey/visit-poses.ts 按实际像素定义五个440×724窗口，横向起点45/450/860/1295/1740，避免按理想等分裁到衣摆。统一底部对齐。SVG仅裁切图集，不重画人物。
- 1280×720真实侧堤检查：护臂姿态、展图、切回休养及右侧对话；无整块背景，未裁掉头靴。细小浅色边缘仍可见，未宣称电影级精修。
- 当前为五张关键姿态切换，没有手部中间帧、口型、金丹行走帧。测记为通用画面，完好/浸损的具体差别仍由台词说明，不声称纸面纹理已逐分支绘制。

## 初始提示词

Create ONE production-ready transparent game sprite atlas, five equally spaced full-body poses in ONE horizontal row, exactly five equal-width cells, no borders or labels. Reference is Su Wanning adult Chinese female cultivator; preserve same face, long black braid, blue-grey and ivory sleeveless Chinese wrap robes, dark sash and brown boots, painterly realistic illustration. All five figures identical body scale, same camera three-quarter view facing slightly left, boots at identical baseline, head at identical height, fully visible with margins, no overlap between cells. Cell 1: looks up welcoming visitor, holds rolled white xuan paper tide chart at waist. Cell 2: both hands gently opening chart at chest. Cell 3: holds unfolded chart and points at its hand-painted Chinese coastal ink lines with right hand. Cell 4: looks toward visitor while rolling chart closed at waist. Cell 5: resting after injury, one hand gently supporting opposite forearm, rolled chart tucked at sash, no blood. Map must be Chinese white xuan paper, no writing or European parchment. Exactly two arms per figure, plausible hands. No scenery, floor, cast shadow, text, labels, decorative frames. True transparent alpha background. Only poses differ, clothes/identity/proportions consistent. Wide landscape atlas.

## 第二次透明边缘清理提示词

Edit this exact five-pose atlas. Remove ALL cloudy grey/white colored haze, speckles and halo outside the actual solid character silhouettes. Outside clothing, hair, skin, boots and paper must be perfectly transparent alpha zero. Preserve the exact five characters, pose details and same positions. Clean crisp antialiased silhouette edges. No shadows or background or mist whatsoever. Make five identical-width cells horizontally with every figure's boot baseline exactly aligned. Keep all figures and hems uncut inside their own cells with empty gutters. Transparent game sprites, NOT a painted background. Preserve five poses as provided.
