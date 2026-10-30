import type { State } from "../world";
import type { Side } from "./state";
import { sideChoices } from "./content";

// Read-only scenes follow facts already recorded by the journey commands.
export function ferryScene(s: State): string {
  const q = s.foundationJourney;
  if (q.ferry === 4)
    return "渡船终于离开了石阶，水面拖出一条长长的白线。沉井所得仍在你的经脉间运转。你可以启程，也可以留下再问问未了的事。";
  if (q.ferry === 3)
    return "执卫退到渡牌后，空船仍系在岸边。有人试着拎起行囊，却不敢先走。祝庭看着你，没有再提那张空名籍。";
  if (q.ferry === 2)
    return q.inheritance === "none"
      ? "石偶停在阶下。石壁上三条运功痕迹在此处分开，一条绵长，一条凌厉，一条在回流中始终不动。你将手贴上石壁，选一条继续推演。"
      : "你已记下井中的行功法。出门时，渡口执卫拦在石阶上，递来一张空名籍：“祝先生说，先签了，再走。”";
  return "井口的水声从地下传来，石壁灵流沿旧刻痕缓缓上行。你按住腕脉，想起闭关时屡次受阻的那一线。渡头却有人攥着还清药债的凭单，第三次被执卫赶回。祝庭替他扶起药筐，将凭单压在名册下：“船小，下一班。”那人没再争，只望着空了半边的渡船。";
}

export function sideScene(s: State, side: Side): string {
  const step = s.foundationJourney.sides[side].step;
  if (step === 3)
    return (
      sideChoices[side][s.foundationJourney.sides[side].outcome]?.result ?? ""
    );
  if (side === "inn" || step === 0) return "";
  if (side === "estate")
    return step === 1
      ? "两份遗嘱并排放在檐下。阙明棠按着传庄的那页，许芦指着后来补下的欠账，谁也没再开口。药圃的水闸又响了一声，你收好育苗记录，先去查看阵眼。"
      : "护圃阵平息，老根下面露出药工一代代补接的细渠。许芦认出父亲的记号，阙明棠也看见阙家的账里从未写过这些人。药圃救活了，旧欠却不能只拿下一季收成来抵；门口的人还在等。";
  return step === 1
    ? "季衡带来的封门令与韩肃另发的西门令放在一起。温蘅将少报过的原诊页收好，跟你走到雪线外。主门旧闸已经弯了，西门槽里却还留着断绳。"
    : "你从西门退回来，手里的引绳仍能承住一人的重量。主门确实挡住了压向山后的雪潮，西门却不是非封不可。季衡接过绳头，没有为自己辩解。温蘅展开原诊页，等你们决定怎样把这件事交代出去。";
}

export const sideTrialResult = {
  estate:
    "乱流退去，你与许芦扒开老根下的泥，找到几代药工补接的细渠，记号与育苗记录一一相合。阙明棠蹲下来，擦去一块木签上的泥：“这片是你父亲接活的？”许芦点头，又指向更深处。她望着连成一片的渠，半晌没有起身。",
  snow: "你稳住主门，雪潮仍将闸杆压弯；转到西门，缺了阵石的留引却能借绳槽接起。韩肃另发的封门令截断了这条退路。季衡试着拉住绳头，手背青筋绷起：“当夜若有人在这里……”温蘅将原诊页展平，一行行读出未归者的名字，他没有把话说完。",
};

export function sisterNote(s: State): string {
  if (s.foundationJourney.sister === "reunited")
    return "郁青姐姐：已在无名渡与郁晚舟当面重逢。她仍在照料伤者，尚未与弟弟一同归家。";
  if (s.adventure.mist.station && s.expedition.cleared === 3)
    return "郁青姐姐：废驿记录证实她曾随队救治，近况仍待打听。";
  if (s.expedition.cleared === 3)
    return "郁青姐姐：药签指向雾海废驿，可前往核对交接簿。";
  if (s.foundationJourney.sister === "promised")
    return "郁青姐姐：讣帖来历可疑，已答应在无名渡打听消息。";
  return "";
}

export function homeScene(s: State): string {
  const q = s.foundationJourney;
  if (q.condensation)
    return "你在窗下运完一周天，沉井与古道所学已能顺畅衔接。灯焰被吐息带得轻轻一晃，丹田里的灵息却稳稳收住。你翻开空白的一页，记下这次行功的不同。";
  if (q.rescue === 4)
    return "古道接应之后，你回听松歇脚。绳结已经收好，两股相冲灵流的触感仍留在腕间。你将沉井铭记与程砚教的稳脉法并排摊开，想试着让它们接成一个完整周天。";
  if (q.rescue >= 2)
    return "内侧已有回讯，程砚仍守着古道落脚点。你在桌上排好下一趟要带的补给，按先前遇见的回流练习运气。出门前，再检查一遍归绳。";
  if (q.rescue === 1)
    return "断裂行牌放在灯下，石屑已从裂口落尽。你还没收到内侧回讯，把问讯的记号抄在纸边，准备再去古道辨认。";
  if (q.inheritance !== "none")
    return "沉井里拓下的铭记摊在桌上。你按所学调转灵息，原先淤在腕脉的那一线已能缓缓通过。窗外山风正起，你想试试这门法在更深的乱流里能走多远。";
  return "";
}
