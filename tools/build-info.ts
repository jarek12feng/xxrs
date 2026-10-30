import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
export function buildInfo() {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? files(path) : [path];
    });
  }
  const inputs = ["src", "public", "desktop"]
    .flatMap(files)
    .concat([
      "package.json",
      "package-lock.json",
      "vite.config.ts",
      "electron-builder.yml",
      "tools/build-info.ts",
    ])
    .sort();
  const hash = createHash("sha256");
  for (const path of inputs)
    hash.update(path).update("\0").update(readFileSync(path)).update("\0");
  const sourceSha256 = hash.digest("hex");
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    /* source archives need no git */
  }
  const { version } = JSON.parse(readFileSync("package.json", "utf8"));
  return {
    version: version as string,
    id: `playtest-${sourceSha256.slice(0, 12)}`,
    sourceSha256,
    baseCommit: commit,
  };
}
