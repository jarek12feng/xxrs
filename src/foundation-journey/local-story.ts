import type { State } from '../world';
import type { PactAction } from '../secret-pact/rules';

export interface FoundationStoryObject {
  id: string; label: string; x: number; y: number;
  actions: PactAction[]; body: string;
}
/** Scene selection is read-only. Existing pact commands own all story facts. */
export function foundationStoryObjects(s: State): FoundationStoryObject[] {
  const q = s.foundationJourney, p = s.secretPact, result: FoundationStoryObject[] = [];
  if (p.site !== 'away') return result;
  if (q.location === 'home' && s.adventure.road.surveyed) result.push({
    id: 'sect-handover', label: '师门交接', x: 58, y: 58,
    actions: ['identityAccept', 'identityDecline'],
    body: p.story.identity === 'accept' ? '你已答应方便时协助护药，未承担固定任职。'
      : p.story.identity === 'decline' ? '你已婉拒固定职责，仍可与听松往来。'
      : '行路记录放在案上，师长等你商议今后的护药合作。是否承担职责，由你决定。',
  });
  if (q.location === 'ferry' && q.ferry >= 2) result.push({
    id: 'well-marks', label: '沉井旧刻', x: 59, y: 65,
    actions: ['observeScale'],
    body: p.story.scale ? '你留下了旧刻度的拓痕：水位相同，旧灵潮的测法却与今日不同。证据尚不足以解释原因。'
      : '井壁上留着几道旧刻度，可以亲手比对如今的水位与灵潮。',
  });
  if ((q.location === 'estate' && q.won.includes('salamander')) ||
      (q.location === 'snow' && q.won.includes('deer')) ||
      (q.location === 'frontier' && q.won.includes('frontier'))) result.push({
    id: 'foreign-ledger', label: '外宗货单', x: 59, y: 65,
    actions: ['foreignNews'],
    body: p.story.news === 'none' ? '取材交接留下了药材货单与修阵副簿，可以核对外宗来往。'
      : `你已在${p.story.news === 'estate' ? '药庄' : p.story.news === 'snow' ? '雪线' : '古道'}核对过外宗往来，将货单上的商路与沿途落脚处圈在路图上。`,
  });
  if (q.location === 'home' && q.epilogue) result.push({
    id: 'home-letter', label: '归山家书', x: 69, y: 73,
    actions: ['replyHome', 'keepHome'],
    body: p.story.letter === 'reply' ? '你已依旧址寄出回信，仍在等药队带回消息。'
      : p.story.letter === 'keep' ? '你收好了旧信，望着熟悉的字迹与落款，久久未语。'
      : '归山行囊里留着一封旧信。你可以依旧址回信，也可以将它收藏。',
  });
  return result;
}
