# 长生未央

本地单机修仙游戏。玩家以同一角色持续修行，通过功法、器物和技艺准备，亲自争取秘境机缘、突破境界，并在途中结识同道、作出取舍。

**当前本地可玩范围：药乡入道、炼气、筑基、金丹至圆满，以及凝婴、出关大典和元婴首次护渡。元婴长期成长与灵界尚未开放。**

更新日期：2026-11-06。应用版本 `0.15.0`，规则存档版本 `60`。这是持续开发的试玩项目；本地实现、自动测试、真实试玩和发行验收分别记录。

- [项目最新情况与后续重点](docs/project-status.md)
- [主线总纲](docs/mainline.md) · [世界观与剧情目录](docs/narrative/README.md)
- [开发约束](AGENTS.md) · [场景与修行时间约束](docs/scene-and-time-contract.md)

## 当前体验

- **一生持续成长**：炼气、筑基、金丹逐段推进；突破需要准备、历练与实际挑战。寿尽可读档或新建独立人物，新人生不继承前世奖励。
- **自选修行方式**：功法、技艺后天学习并可兼修；入宗可选，散修保留成长渠道。剑、医等构筑共用境界主线，以准备和战斗解法产生差异。
- **身处场景行动**：在现场接近人物、器物与道路，展开局部操作。局部走动不扣年月，长途旅行和闭关按规则结算；地图随亲历与能力渐进展开。
- **成长所得有用途**：沉井传承、分念诀、栖尘戒、灵器重铸、法宝温养与出战能力用于后续挑战；复杂提示默认折叠，成本、风险和硬性条件保持可见。
- **人物与世界延续**：苏婉宁相识、同行、分别、重逢与双向接应；恋爱与结契自愿。传讯、拍卖会期、少量人物独立里程碑、旧地回应与周期遗迹已接入。
- **自主准备生活**：晴川药庄可制药、护运、合作求教或直接购买；所学封药手法用于两类合作。物资可用于自炼护寒、雪线取髓及返庄补给，不增加晋升前置。
- **有代价的挑战**：普通试炼可伤退恢复；部分危险秘境和正式天劫有明确致命风险、招式预警与撤离选择。

以上是有限场景与规则的实际接入，不是全世界 NPC 自动模拟或完整开放世界。场景行走、动作与音效已有覆盖，尚非全角色、全关卡逐帧演出。

## 启动与验证

技术栈：Vue 3、TypeScript、Pinia、Vite；部分二维场景使用 Phaser，桌面包装使用 Electron。需要 Node.js 22.12+ 或 24.x。

```sh
npm ci
npm run dev
```

打开终端显示的本地网址。生产构建输出到 `dist/`，可由静态服务器托管。

```sh
npm test
npm run typecheck
npm run build
git diff --check
```

完整回归中的长路线测试可能超过默认超时。近期完整验证使用：

```sh
npm test -- --maxWorkers=2 --testTimeout=15000
```

最近一次有记录的全量结果为 **246 个测试文件、1594 项通过**，构建通过并保留大包体警告。该结果对应 2026-11-06 工作区快照，不代表其后每次修改都自动完成验证；详情与实际浏览器范围见 [项目状态](docs/project-status.md#验证状态)。

## 存档与本地运行

- 存档保存在当前来源的 IndexedDB，支持导入、导出和快照恢复；重要进度请定期导出。
- 更换协议、域名、端口、浏览器或设备后，原存档可能不可见；清理网站数据会删除本地保存。
- 未知未来版本或损坏存档不会被直接降级覆盖。迁移按各版本规则保守处理，不补造旧剧情或奖励；历史版本细节见专题记录。
- 请只在一个标签页游玩。切后台暂停自动行动，没有现实离线收益；运行时没有账号、云存档或后端。

## PC 与试玩包

优先桌面 16:9、鼠标和键盘体验，窄屏为兼容适配。Steam 是目标平台，尚未完成 Windows/Steam 发布验收。

```sh
npm run desktop
npm run test:desktop
npm run package:win
npm run package:playtest
```

`package:win` 用于生成 Windows x64 候选包，`package:playtest` 用于生成网页试玩包。生成包不等于 Windows 实机通过，也不等于 Steam 发布。安装与迁移步骤见 [Windows 试玩说明](docs/windows-demo.md)；旧发布包的内容版本不能代表当前源码。

## 开发接手

先读 [AGENTS.md](AGENTS.md)、[项目状态](docs/project-status.md)、[主线总纲](docs/mainline.md)，再按任务阅读 [成长循环](docs/progression-loop-contract.md)、[场景与时间](docs/scene-and-time-contract.md) 和对应专题实施记录。

| 位置 | 职责 |
| --- | --- |
| `src/core.ts` | 纯 TypeScript 规则公开入口 |
| `src/world.ts`、`src/chapter.ts` | 状态与命令整合、校验和迁移；新业务优先放入领域模块 |
| `src/qi-journey/`、`src/foundation-journey/`、`src/golden-story/`、`src/nascent-soul/` | 分阶段成长与剧情 |
| `src/equipment/`、`src/workshop/`、`src/spirit/`、`src/estate-life/` | 装备、制作、炼神与药庄合作 |
| `src/wayfaring/`、`src/correspondence/`、`src/world-evolution/`、`src/world-events/` | 旅行、通信、日程与事实投影 |
| `src/presentation/actor-action/`、`src/scene2d/` | 共享行动表现、场景与渲染适配 |
| `src/save.ts`、`src/save-version.ts` | 本地保存及版本保护 |
| `src/App.vue` | 界面组合与命令调度 |
| `tests/`、`docs/` | 回归测试、设计、实施及实际验收记录 |

规则层不依赖 Vue 或浏览器 API；界面通过命令更新状态，随机行为只使用存档种子。表现动画不得推进年月或代替规则结算。

旧版轮回、v0.12/v0.13介绍和旧验收数字已移到 [历史 README](README-legacy.md)，不再作为当前规则入口。
