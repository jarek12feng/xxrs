import { extractFile } from "@electron/asar";
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir } from "node:fs/promises";
const build = JSON.parse(await readFile("dist/build-info.json", "utf8"));
const packaged = JSON.parse(
  extractFile(
    "release/win-unpacked/resources/app.asar",
    "dist/build-info.json",
  ).toString(),
);
if (packaged.id !== build.id || packaged.sourceSha256 !== build.sourceSha256)
  throw new Error(
    "Windows package and dist are different builds; rebuild before labeling artifacts",
  );
const names = (await readdir("release"))
  .filter(
    (n) =>
      n.startsWith(`ChangShengWeiYang-Demo-${build.version}-Windows-`) &&
      /\.(exe|zip)$/.test(n),
  )
  .sort();
if (!names.length)
  throw new Error(
    "No matching Windows artifacts; run npm run package:win first",
  );
const artifacts = await Promise.all(
  names.map(async (name) => ({
    name,
    sha256: createHash("sha256")
      .update(await readFile(`release/${name}`))
      .digest("hex"),
  })),
);
await writeFile(
  "release/release-manifest.json",
  JSON.stringify(
    {
      ...build,
      createdAt: new Date().toISOString(),
      artifacts,
      acceptance: "candidate-only; see docs/steam-playtest-review/README.md",
    },
    null,
    2,
  ),
);
await writeFile(
  "release/试玩说明.txt",
  `长生未央 · 免费试玩 ${build.version}\n构建 ${build.id}\n\n包含炼气至筑基归山尾声，金丹及后续篇章未开放。\n安装 Setup.exe 或完整解压 Windows-x64.zip 后运行 cultivation-life.exe；不要单独复制 exe。\n无需 Node 或网页服务器，自动保存在当前用户的 AppData/Roaming/cultivation-life。\n菜单 → 版本与反馈：复制或导出反馈，自行发送给开发者。记录工具另需主动同意，不上传。\n菜单 → 备份与迁移：导出存档，升级前请备份。\n这是未签名候选包，尚未完成真实 Windows 设备验收；遇系统拦截请记录提示，不要关闭安全防护。\n`,
);
console.log(JSON.stringify({ ...build, artifacts }, null, 2));
