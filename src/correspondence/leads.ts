import type { State } from "../world";
import type { Letter } from "./state";
import { seaQuote } from "../outer-sea/rules";
/** Re-evaluates existing rules; a historical report never grants passage or a reward. */
export function messageLead(s: State, l: Letter): string {
  if (l.id.startsWith("friend:su:")) {
    const j=s.friendJourney;
    const latest=j.facts.filter(f=>f.learnedAt!==null).at(-1);
    if(latest?.id==='complete')return "她已休整完毕，先回药路静修；不必再赶去古渡探望，仍可沿旧信路通信。";
    if(j.visitedAt!==null)return "已在古渡当面探望，旧信留存；后续近况仍沿原信路送来。";
    if(s.realm!==2)return "这封旧信留作见闻，去向请以新的来信为准。";
    if(latest?.id==='returned'||latest?.id==='resting') {
      const until=j.startedAt!+18;
      if(s.month>=until)return "这次返渡休养的日子已经过去，先候新的回音，不必按旧信赶路。";
      if(s.outerSea.location==='ferry')return "已在外海古渡，选择“侧堤 · 苏婉宁返渡”，到石台旁当面问候。";
      if(s.outerSea.location==='home'||s.outerSea.location==='guild'){
        const q=seaQuote(s,{kind:s.outerSea.location==='home'?'sail':'guildReturn'});
        return `从行旅现场循航路回古渡，单程${q.months}月，再寻侧堤石台。${s.month+q.months>=until?'按此路程会错过本次休养，等她后续回信即可。':'预计可赶上此次休养；到场后以实际去向为准。'}`;
      }
      return "先结束眼前的行程，返回古渡，再查看侧堤去向。";
    }
    return "可沿旧信路联系；古渡侧堤留有去向线索，出行期间不能当面探望。";
  }
  if (l.id.startsWith("sea:ruins")) {
    const o = s.outerSea;
    if (o.cleared === 2)
      return "此处历练已经完成，可在人物与功法、法宝界面查看所得的后续用途。";
    if (s.realm !== 2) return "这封旧信留作见闻；当前去路以地图与现场为准。";
    if (o.location === "home") return "先沿已有航路前往外海古渡，再核对行装。";
    if (o.location === "guild") return "先从沧澜会馆沿航路返回古渡。";
    if (o.location === "ruins")
      return "已经抵达遗迹，请在现场继续探查，留意阵压与退路。";
    if (o.cleared === 1 && o.reward === "none")
      return "先在古渡选择外府机缘，再准备内府之行。";
    if (!o.prepared) {
      const q = seaQuote(s, { kind: "prepare" });
      return (
        q.error ||
        `在古渡准备遗迹行装，需要${q.stones}灵石、${q.herbs}灵草、${q.months}月。`
      );
    }
    const q = seaQuote(s, { kind: "enter" });
    return q.error || `行装已备，可以从古渡沿潮路入府，行程${q.months}月。`;
  }
  return "";
}
