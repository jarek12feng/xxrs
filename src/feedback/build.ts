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
  "免费试玩 · 炼气至筑基归山尾声；金丹及后续篇章尚未开放。";
