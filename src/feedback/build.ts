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
  "本地开发版 · 炼气至金丹圆满，含离照取药、凝婴与出关大典；元婴长期修行与灵界尚未开放。";
