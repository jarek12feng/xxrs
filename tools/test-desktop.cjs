const { buildSync } = require("esbuild");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "xxrs-desktop-"));
const bundle = path.join(temp, "probe.js");
try {
  buildSync({
    entryPoints: ["tools/desktop-probe.ts"],
    outfile: bundle,
    bundle: true,
    format: "iife",
    platform: "browser",
  });
  for (const phase of ["write", "read", "corrupt", "recovered"]) {
    const result = spawnSync(
      require("electron"),
      [
        "tools/desktop-smoke.cjs",
        path.join(temp, "profile"),
        phase,
        bundle,
        ...(process.argv[2] ? [path.resolve(process.argv[2])] : []),
      ],
      { stdio: "inherit", timeout: 45000 },
    );
    if (result.status !== 0)
      throw (
        result.error ||
        new Error(
          `Desktop ${phase} failed: status=${result.status}, signal=${result.signal}, error=${result.error?.message}`,
        )
      );
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
