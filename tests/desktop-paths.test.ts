import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
const { resolveAsset } = createRequire(import.meta.url)("../desktop/paths.cjs");
const root = path.resolve("/game/dist");
describe("desktop offline resource boundary", () => {
  it("resolves the entry and absolute scene assets on the stable origin", () => {
    expect(resolveAsset(root, "xxrs://game/")).toBe(
      path.join(root, "index.html"),
    );
    expect(resolveAsset(root, "xxrs://game/scenes/a.webp")).toBe(
      path.join(root, "scenes/a.webp"),
    );
  });
  it("rejects other origins, malformed paths and encoded traversal", () => {
    for (const url of [
      "https://game/",
      "xxrs://other/",
      "xxrs://game:80/",
      "xxrs://game/%2e%2e%2fsecret",
      "xxrs://game/%5csecret",
      "xxrs://game/%00",
      "xxrs://game/%ZZ",
    ]) {
      expect(resolveAsset(root, url)).toBeNull();
    }
  });
});
