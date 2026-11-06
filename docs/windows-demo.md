# Windows 免费试玩候选版

2026-11-06 文档更新：当前源码应用 v0.15.0、规则存档 v60，可玩至金丹圆满、凝婴及元婴首次护渡，范围与验证见 [项目最新情况](project-status.md)。本页的打包、安装与存档操作仍供参考；此前 v18、炼气至筑基的包体与验收属于历史记录。本次未重新打包或做 Windows 实机验收，不能将旧包当作当前源码交付。

目标 Windows 10/11 x64，本地单机，无需 Node、网页服务器或账号。尚未发布到 Steam，没有付费功能。

## 生成与识别

```sh
npm ci
npm test
npm run test:desktop
npm run package:win
node tools/package-playtest.mjs
node tools/package-release-manifest.mjs
git diff --check
```

Windows 包位于 `release/`：`ChangShengWeiYang-Demo-0.15.0-Windows-x64-Setup.exe` 与同版本完整 ZIP。构建时把源码、公共资源、桌面入口和锁文件生成同一内容指纹，标题页、菜单 → 版本与反馈、`dist/build-info.json` 和交付清单共用标识。应用版本相同但内容指纹不同，应分别记录反馈。

`release/试玩说明.txt` 和 `release/release-manifest.json` 由当前构建生成。ZIP 必须全部解压后运行 `cultivation-life.exe`，不能只复制 EXE。`package:playtest` 生成的 `release/playtest-<指纹>/web/` 是网页包，不能当作 Windows 安装包。

## 保存与反馈

- 自动存档、手动档及备份导入导出继续可用；升级前先在“备份与迁移”导出。
- 数据目录 `%APPDATA%\cultivation-life`，应用 ID `com.xxrs.cultivationlife`，来源 `xxrs://game/` 不变；安装目录与存档分离，卸载配置保留用户数据。
- 网页版与桌面版存储独立，请使用 JSON 导出、导入迁移；不要复制单个 LevelDB 文件。
- 菜单 → 版本与反馈可复制、导出简短反馈；不包含姓名、种子或完整存档，不自动上传。
- 记录试玩过程需要额外主动同意，仅当前会话内存记录，刷新前导出。没有新增遥测或后台收集。

## 自动检查与真实 Windows 验收

本地桌面烟测使用临时档案，检查写入、跨进程读取、当前快照损坏回退及再次读取，父进程必须确认每阶段以 0 退出。`node tools/test-desktop.cjs --repeat 3` 可连续验证三轮，不会忽略失败或重试到绿。

已加入 `.github/workflows/windows-demo.yml`，可手动触发 Windows 构建、桌面测试、静默安装、启动和关闭检查；不自动发布、不创建 Release。本轮未推送、未运行远端 workflow。它仍不能替代实际 Windows 缩放和声音设备验收。

公开分发前须完成：普通用户安装；中文用户名路径；125%/150% 缩放；断网运行；导出/导入；覆盖更新、卸载重装后读档；重复启动；关闭进程无崩溃；长时间音频与前台运行。仅在复制的测试档案中破坏快照。

当前包未签名，不要求玩家关闭安全防护。本机 macOS 的外部动态库退出崩溃及当前验证边界见 [免费试玩修复记录](steam-playtest-review/README.md)。Windows 实机验收没有完成，不应宣称桌面发布门已通过。
