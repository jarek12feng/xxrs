# 沈观微问法人物：V2补漏

2026-11-04。按父任务授权，仅补现有问法席的合法在场形象，不改剧情/数值。

身份依据：`docs/narrative/09-world-and-sects.md` 的澄渊宗元婴中期女长老、守潮职责，以及 `11-nascent-soul-and-beyond.md` 的有限经验传授者。检索public/art和既有候选，未找到沈观微本人素材；没有借用其他NPC的脸。青灰衣袍、成熟女性面容与持卷示教姿态为本次原创视觉设定，不追加宗门职务或人物经历。

- 工具：内置image_gen，transparent_background=true。完整提示词 `prompt.txt`。
- 原图 `originals/shen-guanwei-teaching.png`，实际1024×1536 RGBA；生成器原路径及SHA256见manifest.json。
- 运行资源 `public/art/review-fixes/shen-guanwei-teaching-v1.webp`，实际768×1152，147136字节，保留透明通道。
- QA：`QA/light-dark-450.png`为450px高度浅/深底检查。全身、鞋、发髻、手和袖摆完整，无伪字、无实色矩形背景；无需扣除背景或重绘。导出alpha范围0–255，完全透明像素约56.43%，详细边界见manifest。

接入：GoldenStoryScene只在realm=2、place=conclave、conclave.location=court、introduced=true且teachingSpeaker.present（month<2400）时显示。公开传讲与晚年讲录均不显示沈观微本人。原有两步亲习保留，只用已保存practice状态改变人物轮廓光；这是一张示教姿态加轻量表现，不是逐帧人物动画。

实际双尺寸、两个公共命令检查点的浏览器证据及测试/构建结果见 `docs/golden-completion/review-fixes/shen-scene/README.md`。
