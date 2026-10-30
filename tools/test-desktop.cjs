const { buildSync } = require("esbuild");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "xxrs-desktop-"));
const bundle = path.join(temp, "probe.js");
const args = process.argv.slice(2);
const repeatIndex = args.indexOf("--repeat");
const repeat = repeatIndex < 0 ? 1 : Number(args.splice(repeatIndex, 2)[1]);
if (!Number.isInteger(repeat) || repeat < 1 || repeat > 20)
  throw new Error("--repeat must be 1..20");
try {
  buildSync({
    entryPoints: ["tools/desktop-probe.ts"],
    outfile: bundle,
    bundle: true,
    format: "iife",
    platform: "browser",
  });
  for (let run = 0; run < repeat; run++) {
    for (const phase of ["write", "read", "corrupt", "recovered"]) {
      const result = spawnSync(
        require("electron"),
        [
          "tools/desktop-smoke.cjs",
          path.join(temp, `profile-${run}`),
          phase,
          bundle,
          ...(args[0] ? [path.resolve(args[0])] : []),
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
    console.log(
      JSON.stringify({
        run: run + 1,
        phases: 4,
        assertionsAndProcessExitPassed: true,
      }),
    );
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
