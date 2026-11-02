export interface BuildInfo {
  version: string;
  id: string;
  sourceSha256: string;
  baseCommit: string;
}
declare const __BUILD_INFO__: BuildInfo;
export const build =
  typeof __BUILD_INFO__ === "undefined"
    ? {
        version: "development",
        id: "development",
        sourceSha256: "",
        baseCommit: "unknown",
      }
    : __BUILD_INFO__;
export const playableScope =
  "免费试玩 · 炼气至结丹与金丹初行；金丹中后期及更高境界尚未开放。";
