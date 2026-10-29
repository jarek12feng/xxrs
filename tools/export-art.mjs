// Requires cwebp on PATH. Preserve the candidate PNGs; export only runtime sizes.
import { readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const assets = new Map();
for (const version of ["v1", "v2"]) {
  const root = new URL(`../docs/art-candidates/${version}/`, import.meta.url);
  const manifest = JSON.parse(
    readFileSync(new URL("source-manifest.json", root)),
  );
  for (const asset of manifest.assets) assets.set(asset.id, { ...asset, root });
}
for (const asset of assets.values()) {
  const target = new URL(`../public/art/${asset.kind}/`, import.meta.url);
  mkdirSync(target, { recursive: true });
  execFileSync("cwebp", [
    "-quiet",
    "-q",
    "82",
    "-resize",
    "0",
    asset.kind === "characters" ? "640" : "192",
    new URL(asset.file, asset.root).pathname,
    "-o",
    new URL(`${asset.id}.webp`, target).pathname,
  ]);
}
