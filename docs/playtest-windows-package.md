# 历史交付记录：旧 A 版

本文件记录 2026-10-29 的旧包，不是当前交付入口。请以 [Windows 免费试玩候选版](windows-demo.md) 和 [当前修复记录](steam-playtest-review/README.md) 为准。

# 冻结版 Windows 试玩交付记录

日期：2026-10-29。冻结编号 `playtest-20261029-A`，应用 v0.14.0，存档 v14。

用户授权将当前冻结版本打包供邀请试玩；未改变功能、数值、存档规则或构建配置。保持本地未提交代码，不创建发布或上传到外部服务。冻结清单在打包前后核对，运行文件保持一致。

## 交付文件

输出目录：`release/playtest-20261029-A/`（不提交 Git）。

- `XiuXianRenSheng-playtest-20261029-A-TesterKit.zip`：建议转发给玩家，内含安装器、UTF-8 文本试玩说明、可填写反馈表与校验清单。
- `XiuXianRenSheng-Demo-0.14.0-Windows-x64-Setup.exe`：独立安装器。
- `XiuXianRenSheng-Demo-0.14.0-Windows-x64.zip`：完整免安装应用，必须全部解压后运行 `cultivation-life.exe`，不能只拷贝 exe。
- `SHA256SUMS.txt`：以上三项产物的 SHA-256；`build-inputs-sha256.txt` 补记打包配置和包内 ASAR 的摘要。

玩家附件源文件：[试玩说明](playtest-kit/试玩说明.txt)、[反馈表](playtest-kit/反馈表.txt)。组织者使用 [详细观察流程](first-30-min-playtest.md)。发布身份与数据目录未改动，安装器与免安装版使用同一桌面存档来源；已有玩家先导出备份再测。

## 构建与检查

执行 `npm test`：34 个文件、306 项测试通过。执行 `npm run package:win -- --config.directories.output=release/playtest-20261029-A`：包含类型检查与 Vite 生产构建，输出 Windows x64 NSIS 安装器与 ZIP，禁止自动发布。

包内 `dist` 与 `desktop` 共 28 个文件和本机构建逐字节一致；包内无 tests/tools 目录及开发环境试听音频。原始冻结清单未覆盖根目录 YAML，因此额外记录 `electron-builder.yml` 摘要；该配置相对 Git HEAD 无修改，不将本次补记冒充原清单已有覆盖。

在 macOS ARM64 的 Electron 45.1.0 上，分别针对本地入口及 Windows 包内 `app.asar/desktop/main.cjs` 执行现有桌面烟测：write/read/corrupt/recovered 四阶段均通过，进程退出码 0，读取存档格式为 v14。使用隔离临时档案，不操作玩家真实存档。系统出现 LaunchServices 诊断输出，但测试进程正常退出。

烟测验证了启动、当前背景解码、渲染层无 Node require、跨进程读档及损坏回退；本次首页 HTML 图片计数为 0，不宣称逐张场景/人物图片均已渲染验收。资源完整性另由包内文件对比保证。

## 使用边界

本包未签名，使用默认 Electron 图标。尚未在真实 Windows 上执行安装器、游戏进程、更新/卸载重装及缩放测试，macOS 包内入口烟测不能替代这些步骤。先小范围受控测试，安装被系统阻止时记录问题，不要求玩家关闭安全防护。

本次提供试玩交付，不解除功能与数值冻结。反馈按 A 版归档；未来若修复阻断问题，应重新验证并采用新的冻结编号，不覆盖 A 版样本。
