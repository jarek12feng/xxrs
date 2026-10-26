# v0.6 雨中归途：场景驱动的开篇验证

## 设计原则

玩家是在修仙世界中生活的人，不是数值面板的操作员。循环应是：发现值得追寻的人或事 → 探寻与结识 → 遭遇困难 → 学习、求助或准备 → 改变结果 → 看见更远的世界。修为是通向目的的能力，不是唯一目的。

后续每个章节都要回答：我在哪里？我为什么在意？这里有谁？我能主动做什么？失败让我知道什么？成长后能看见什么？朋友需要自己的目标与回应；任务后应看到世界或关系的变化，而非只领数字奖励。

## 本轮落地与边界

默认界面改为当前冒险；属性收进折叠面板，修炼和装备转入独立页。首段为渡口调查、药庐准备、雾林辨路、山祠营救、灯火归途。线索解锁去向，配药/同行/护体三种准备有不同解法与结果。盲闯失败保留线索，假路破坏准备，玩家可撤回调整。奖励只发一次。

这是一段短篇的体验验证，不声称已有 15–20 分钟完整内容。探索暂不消耗修行月份，练习材料免费，尚未与通用道具消耗、境界难度统一。筑基后的旧地图仍是既有功能面板，未完成全世界场景重构。下一步应先试玩验证节奏，再把场景交互、持续关系反馈与成长门槛延伸至后续章节，不继续横向堆系统。

新角色直接进入渡口。旧档迁移为可自愿接取的独立委托，不重置原剧情、人物关系或装备。完成后原陆迟初逢文案改为再逢，保留原选择。存档 v6，首写备份 original-v5，未来版本拒绝覆盖。规则由 adventure.ts 管理，所有持久化变化仍经命令与统一自动存档。

## 桌面与移动端

验证：84 项自动测试与构建通过；浏览器在独立 5179 端口完成同行路线、刷新恢复、360/430 宽度和 844×390 横屏观察。直接游戏页控制台无错误。开发 iframe 在热更新重载时观察到 MutationObserver 报错，业务代码没有该观察器，来源未最终定位；不将其计为已完成真机验证。原 5173 用户存档未被测试操作覆盖。

以桌面和手机共同设计；手机不缩放桌面三栏。单列场景、折叠行囊、可触达导航，主要剧情选项至少 52px 高，手机一般按钮至少 48px、顶部工具至少 44px。正文 15px 起，输入框 16px，适配 safe-area 与动态视口高度，尊重减少动态效果。

tools/mobile-preview.html 是仅开发服务使用的 iframe 视口验收页，可查看 360/390/430 宽度和 844×390 横屏；不进入生产 Vite 构建。实际浏览器验证不等于真机测试。

未来目标包括 Steam 与 TapTap，但当前没有桌面/Android 安装包、平台 SDK、手柄支持、平台云存档或商店发布流程。发布前需独立规划本地文件存档/账号云存档、断网与升级迁移、真机触控和性能、平台合规与素材许可审核。不得将网页适配描述为已可上架。

## 美术

复用渡口、遗府和月台场景；新增药庐与雾林由内置 imagegen 生成。最终资源为 public/scenes/apothecary.jpg 与 public/scenes/mist-path.jpg，压缩后各约 0.6–0.7MB；原始 PNG 保留在生成目录。移除本轮临时 SVG 草图，不影响历史资源。

最终提示词：

### 1

Use case: stylized-concept. Asset type: Chinese cultivation game environment background. A welcoming ancient mountain apothecary interior at dusk: worn wooden medicine drawers, bundles of drying herbs, low ceramic brewing stove and small warm lamp, wooden worktable with green herbs, lattice window opening to misty pine mountains. Fine hand-painted Chinese ink and watercolor on ivory rice paper, painterly realistic materials, muted sage green and warm amber. Wide landscape composition, central worktable and lamp readable even when cropped to portrait mobile screen; no people, no text or labels, no logos or watermark. Calm refuge and human warmth after a dangerous journey, not an icon or flat vector illustration.

### 2

Use case: stylized-concept. Asset type: Chinese cultivation game environment background. A winding narrow mountain forest trail in blue-green mist, tall old pine trunks, wet stones and moss, one clearly visible red cloth ribbon tied around a branch beside the central path, a fork ahead disappearing into fog. Fine hand-painted Chinese ink and watercolor on ivory rice paper, painterly natural materials, restrained deep jade and grey. Wide landscape composition, central path and red ribbon readable when cropped to portrait mobile screen; no people, no text, no symbols, no logos or watermark. Evoke curiosity and quiet danger rather than horror.

