import { quoteSettlement, settleResources } from '../economy';
import type { State } from '../world';
import type { Initiation } from './state';
export type InitiationAction = `entry:${'unload'|'steady'|'force'|'seek'|'review'|'terms'|'defer'|'careful'|'rush'|'contract'}`;
const actions = new Set<string>(['entry:unload','entry:steady','entry:force','entry:seek','entry:review','entry:terms','entry:defer','entry:careful','entry:rush','entry:contract']);
export const isInitiationAction = (a:string): a is InitiationAction => actions.has(a);
export function arrivalActive(s: State) {
  return s.adventure.step === 'ferry' && s.qiJourney.narrative.initiation.arrival !== 'legacy'
    && (s.qiJourney.narrative.initiation.arrival !== 'sensed' || s.qiJourney.narrative.motive === 'unspoken');
}
export const hasCultivationKit = (s:State) => s.qiJourney.narrative.initiation.kit !== 'none';
export const starterReward = (s:State) => ({stones:24,herbs:s.adventure.rescueChoice === 'supplies' ? 4 : 0});
export function kitError(s:State) {
  return hasCultivationKit(s) ? '' : quoteSettlement(s,{},starterReward(s)).error;
}
/** The bag is a saved possession; its capacity is not a new inventory simulation. */
export function grantKit(s:State, source:'sect'|'independent') {
  if(hasCultivationKit(s))return;
  settleResources(s,{},starterReward(s));
  s.qiJourney.narrative.initiation.kit=source;
}
function localError(s:State) {
  if(s.status !== 'alive' || s.pending || s.social.scene || s.social.arena.duel || s.expedition.duel || s.qiJourney.node || s.qiJourney.duel || s.foundationJourney.duel || s.sectContest.duel || s.outerSea.duel || s.conclave.duel || s.lizhao.duel || s.ascension || s.wayfaring.trip || s.wayfaring.passage || s.spirit.trial || s.nascentSoul.attempt || s.qiJourney.narrative.location !== 'home' || s.secretPact.site !== 'away' || s.goldenCore.expedition !== 'idle' || s.outerSea.location !== 'home' || s.conclave.location !== 'away' || (s.treasures.auction?.entered && !s.treasures.auction.closed)) return '先结束眼前的事件或行程，再到听松药坪求教';
  if(s.realm === 1 && s.foundationJourney.location !== 'home') return '先回听松山，再到药坪求教';
  return '';
}
export function admissionWitness(s:State): Initiation['witness'] {
  if(s.expedition.cleared >= 1) return 'escort';
  if(s.qiJourney.preparations.some(p => p.medicine === 3)) return 'valley';
  if(s.qiJourney.preparations.some(p => p.wander === 3)) return 'ruins';
  if(s.adventure.step === 'done' && s.adventure.rescueChoice !== 'legacy' && s.qiJourney.narrative.initiation.practice === 'passed')return 'rescue';
  return 'none';
}
export function initiationError(s:State, a:InitiationAction):string {
  const blocked = localError(s); if(blocked) return blocked;
  const n=s.qiJourney.narrative.initiation;
  if(a === 'entry:unload') return s.adventure.step === 'ferry' && n.arrival === 'landed' ? '' : '药队已经卸下行装';
  if(a === 'entry:steady' || a === 'entry:force') return s.adventure.step === 'ferry' && n.arrival === 'unloaded' ? '' : '先将家乡的药包搬上渡口';
  if(s.adventure.step !== 'done') return '先把受困药工带回山下，再谈求学';
  if(s.journey.branch !== 'none') return '你已有师承';
  if(a === 'entry:seek') return ['none','deferred'].includes(n.admission) ? '' : '已在听松求学，先完成历练';
  if(a === 'entry:defer') return n.admission === 'deferred' ? '你已决定暂作散修' : '';
  if(a === 'entry:careful' || a === 'entry:rush') return n.admission !== 'seeking' ? '先说明求学之意，再试药坪上的护路绳阵' : n.practice === 'passed' ? '你已稳住绳阵，无须重试' : '';
  if(a === 'entry:contract') {
    if(n.admission !== 'deferred')return '先说明以散修身份求学的选择';
    if(hasCultivationKit(s))return '入道物资已经领过';
    if(n.practice !== 'passed')return '先在药坪试稳护路绳阵，再凭亲历承接药队契约';
    return kitError(s);
  }
  if(a === 'entry:review') {
    if(n.admission !== 'seeking') return '先向执事说明求学之意';
    return admissionWitness(s) === 'none' ? '先试护路绳阵：辨清绳结和受力，再以山祠营救的亲历请执事评议' : '';
  }
  return n.admission === 'recommended' ? '' : '先带着亲历成果，请执事引荐';
}
export function joinError(s:State):string {
  const blocked=localError(s); if(blocked)return blocked;
  if(s.journey.branch !== 'none')return '你已有师承';
  if(s.adventure.step !== 'done')return '先救回药工，在听松求学';
  return s.qiJourney.narrative.initiation.admission === 'pledged' ? kitError(s) : '须经求学、历练引荐，并了解门规后，才能拜入听松宗';
}
export function runInitiation(input:State,a:InitiationAction,id:string):State {
  if(!id || input.seen.includes(id) || initiationError(input,a))return input;
  const s=structuredClone(input), n=s.qiJourney.narrative.initiation;
  switch(a) {
    case 'entry:unload': n.arrival='unloaded'; n.last='你把家乡的药包搬上石阶。药乡种药、晒药，听松宗护路、收药炼丹；船上的人靠这条药路过活。长辈缝的药囊里压着温蘅留下的引荐纸：她认出你能感应灵气，叫你来山下求教，却还没有收你入门。';break;
    case 'entry:force': n.last='你急着把气息压进胸口，反而听不清那一缕灵气。忆起运药遇险时老药师的话：先把呼吸放稳。他只懂养息，往后的修行还得自己求学。放缓气息，可以再试。';break;
    case 'entry:steady': n.arrival='sensed'; n.last='你依照老药师教的节律呼吸，终于辨出风雨间一缕清凉。温蘅说过，这只是引气的开端；学会真正的功法，才有可能跨过凡人的百年。你是自己辞别家人、乘这条船来求道的。这一趟，你想求什么？';break;
    case 'entry:seek': n.admission='seeking'; n.last='温蘅认出你带来的引荐纸：“你来时只会调息，如今肯先看清险处再出手，可以留在山下求学。先说说那日你是怎么救人的，再试给我看。”季衡摆出旧药篓与护路绳阵：一根绳承重，另一根标记退路。阵线有松有紧；先辨清受力，还是一把拉紧？这次只试判断与配合，不借你尚未学过的神功。';break;
    case 'entry:rush':n.practice='retry';n.last='你一把拉紧两根绳，空药篓随阵线倾斜，退路也被自己绷死。季衡及时卸下阵力：“先看承重落在哪边，别把退路当主绳。”没有损失物资，松开绳结后可以重试。';break;
    case 'entry:careful':n.practice='passed';n.last='你先辨清药篓的受力，把承重绳绕过石桩，留松另一根归绳，再示意同伴缓缓收力。空篓平稳通过阵线，退路仍在手中。温蘅点头：初学者不必逞强，能看清险处、运用所学并与人配合，才有继续受教的根基。';break;
    case 'entry:contract':grantKit(s,'independent');n.last='药工与药队把营救、辨药和试阵的酬劳合为下品灵石二十四枚，另交一只修补过的粗制储物袋。温蘅准你从可外传的基础抄本中选一册，药队日后有差事另行商议；此契不立宗籍，也不强迫你接下所有委托。袋中不能装活物，眼下只够收纳随身物资。你接过契纸，正式开始自筹修行。';break;
    case 'entry:review': n.admission='recommended';n.witness=admissionWitness(s);n.last=`${{rescue:'温蘅核过药工生还与药坪试阵的经过，季衡也见你留下了退路',escort:'季衡核过药车平安抵达的回执',valley:'温蘅听过许照岚带回的护药经过',ruins:'执事核对你勘路破阵的亲历'}[n.witness as 'rescue'|'escort'|'valley'|'ruins']}：“遇险肯先看退路，动手也有分寸。我愿替你引荐。只是入门以后该守什么规矩、担什么差事，你须先听明白。”`;break;
    case 'entry:terms': n.admission='pledged';n.last='执事展开门册：丹堂与剑院同属听松宗，入门可受传授、承接师门差事，须护持药路，不可侵夺凡人药资；贡献来自实际付出，不凭名分白取资源。丹堂重药理，剑院重护送，功法仍可兼学。听松有凝丹传承，更远的道途仍须自己寻访。你可以选择堂口正式行礼，也可以暂缓。';break;
    case 'entry:defer':n.admission='deferred';n.last='你收好引荐纸，决定先以散修身份行走。温蘅没有收回求教的允诺：“坊市仍可学法，药路仍可同行。哪天想清楚了，再来谈拜师。”若暂不入宗，可凭营救与药坪试阵的亲历同药队立约，取得入门抄本、薄酬与旧储物袋，再自己筹措后续修行。已领过的入道物资不再重发。';break;
  }
  s.qiJourney.last=n.last;
  s.seen=[...s.seen,id].slice(-512);
  return s;
}
