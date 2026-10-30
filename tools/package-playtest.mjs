import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { join, relative } from "node:path";
async function files(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result.sort();
}
// Read identity emitted by Vite from the actual build, never relabel stale dist.
const info = JSON.parse(await readFile("dist/build-info.json", "utf8"));
const { id, sourceSha256: source, baseCommit: commit } = info;
const root = join("release", id);
await mkdir(root, { recursive: true });
const manifest = {
  ...info,
  id,
  sourceSha256: source,
  baseCommit: commit,
  createdAt: new Date().toISOString(),
  saveVersion: 18,
  status: "development-verified; external-player-validation-pending",
};
await writeFile("dist/playtest-build.json", JSON.stringify(manifest, null, 2));
await cp("dist", join(root, "web"), { recursive: true });
await cp("docs/first-30-min-playtest.md", join(root, "试玩观察表.md"));
const artifacts = [];
for (const path of await files(join(root, "web")))
  artifacts.push({
    path: relative(root, path),
    sha256: createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
  });
await writeFile(
  join(root, "manifest.json"),
  JSON.stringify({ ...manifest, artifacts }, null, 2),
);
await writeFile(
  join(root, "使用说明.txt"),
  `长生未央 · 免费试玩\n构建：${id}\n\n这是静态网页包，请通过本地或测试站点 HTTP 服务打开 web/index.html，勿直接双击 HTML。\n本仓库可运行 npm run preview:playtest，然后打开 http://127.0.0.1:5219/?playtest=1 。\n使用独立浏览器档案。菜单 → 版本与反馈可复制或导出反馈文本，也可打开自愿记录工具；同意后才记录，不上传。\n不应覆盖日常存档。刷新前导出记录。工具不上传数据，人工观察与求助记录见试玩观察表。\n包含炼气、筑基、圆满试炼与归山尾声；金丹未开放。\n此包未完成陌生玩家验收，也不是 Windows 安装验收。\n`,
);
console.log(
  JSON.stringify(
    { ...manifest, output: root, files: artifacts.length },
    null,
    2,
  ),
);
