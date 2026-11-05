import type { State } from "../world";
import type { MessageDraft } from "../correspondence/sources";
import { tideKnown, tideSchedule } from "./index";
export function tideNoticeMessage(
  edition: number,
  opens: number,
  closes: number,
): MessageDraft {
  return {
    id: `tide:${edition}:notice`,
    kind: "opportunity",
    sender: "古渡守潮人",
    title: "潮隙侧廊将露出石道",
    body: `旧府侧廊本次在第${opens}月至第${closes}月前退潮。须先循航路回古渡，再备灵石6、灵草2的行装；往返需3至4月，务必留足退路。旧府法宝不再重现，可勘察潮纹、取少量材料。`,
    destination: "world",
    reliability: "public",
    expires: closes,
  };
}
export function tideMessages(s: State): MessageDraft[] {
  if (!tideKnown(s)) return [];
  const q = tideSchedule(s.month),
    out: MessageDraft[] = [];
  if (s.realm === 2 && s.month >= q.announces && s.month < q.closes)
    out.push(tideNoticeMessage(q.edition, q.opens, q.closes));
  const t = s.tideSurvey;
  if (t.edition)
    out.push({
      id: `tide:${t.edition}:result`,
      kind: "reply",
      sender: "侧廊行旅记录",
      title: "本次潮隙之行已有结果",
      body:
        {
          none: "",
          careful: "你在浅廊采得灵草4，沿绳平安返渡。",
          deep: "你辨清深处潮纹，带回灵草6、玄铁料2。",
          retreated: "你在深处及时撤回，带回灵草2，擦伤增加1。",
          interrupted:
            "此行途中中断，行装已经耗用，未取材料。本次潮期不再重入。",
        }[t.outcome] + "旧府取宝记录仍在，本次结果另记；等下次退潮再作打算。",
      destination: "world",
      reliability: "personal",
      expires: null,
    });
  return out;
}
