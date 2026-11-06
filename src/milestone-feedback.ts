import { ceremonyGuests } from './nascent-soul/guest-art';
import type { State } from './core';
import { characterArt, heroArt } from './presentation/art';
export interface MilestoneFeedback {
  kind: 'foundation' | 'flight' | 'manual' | 'relic' | 'farewell' | 'reunion' | 'ceremony' | 'emergence';
  background?: string;
  companion?: string;
  guests?: {name: string; art: string}[];
  title: string;
  hero: string;
  seated: string;
  item?: string;
  beats: [string, string, string];
}
// Only committed transitions create a scene; loading or repeating an action cannot replay it.
export function milestoneFeedback(before: State, after: State): MilestoneFeedback | undefined {
  if (before === after || after.status !== 'alive' || before.life !== after.life) return;
  const character = heroArt(after.social.gender, after.realm);
  const actor = { hero: characterArt(character, 'idle'), seated: characterArt(character, 'meditate') };
  if (before.realm === 0 && after.realm === 1) return { ...actor, kind: 'foundation', title: '道基初成', beats: ['散乱灵息归于丹田，周天渐稳。', '气息凝定，护体灵光沿衣袖舒展。', '你起身望向山外，新的道途已在眼前。'] };
  if (before.wayfaring.swordFlight === 'none' && after.wayfaring.swordFlight === 'practiced') return { ...actor, kind: 'flight', title: '第一次离地', beats: ['你稳住剑身，将灵息送入足下。', '剑身缓缓离地，脚下影子渐远。', '起落初试已成；下一程可选择御剑，安全抵达后才算熟习。'] };
  if (!before.nascentSoul.emerged && after.nascentSoul.emerged) return {...actor, kind:'emergence', title:'长关已尽 · 平安出关', background:'/art/world-story/golden/dao-discussion-terrace.webp', beats:['静室门开，庭前灯火照见来路。','你收拢护体灵息，走入庭中。','平安消息已经送出；观礼或简礼，仍由你自己决定。']};
  if (before.nascentSoul.celebration !== after.nascentSoul.celebration && ['formal','simple'].includes(after.nascentSoul.celebration)) return {...actor,kind:'ceremony',title:after.nascentSoul.celebration==='formal'?'元婴观礼 · 宾主相见':'旧识简礼 · 一盏清茶',background:'/art/world-story/golden/dao-discussion-terrace.webp',guests:ceremonyGuests(after.nascentSoul.guests),beats:['庭前礼案已设，书函依次陈放。',after.nascentSoul.guests.length ? '到场者：'+after.nascentSoul.guests.join('、')+'。' : '庭中没有来客，你将平安书函收妥。','礼仪已定，古渡测绘队送来潮隙复起的消息。下一程可亲赴勘察。']};
  const oldReunion=before.goldenStory.reunion.stage, newReunion=after.goldenStory.reunion.stage;
  const goldenMeet=oldReunion==='invited' && newReunion==='met';
  const goldenDepart=oldReunion==='shared' && newReunion==='departed';
  const foundationMeet=!before.foundationJourney.reunion && after.foundationJourney.reunion;
  const foundationDepart=before.foundationJourney.departedAt===null && after.foundationJourney.departedAt!==null && after.foundationJourney.whereabouts==='away';
  if(goldenMeet || goldenDepart || foundationMeet || foundationDepart) {
    const farewell=goldenDepart || foundationDepart;
    const shen=goldenMeet || goldenDepart || after.social.gender==='male';
    return {...actor,kind:farewell?'farewell':'reunion',title:farewell?'互留信路 · 各赴前程':'按约重逢 · 互看所得',background:goldenMeet || goldenDepart?'/art/world-story/golden/tide-dike-council.webp':'/art/foundation-journey/reunion-courtyard.webp',companion:shen?'/art/companionship/shentinglan-travel.webp':'/art/companionship/yinzhaochuan-travel.webp',item:farewell?'letter':'map',beats:farewell?['你们收妥行装，将归途与信路记下。',shen?'苏婉宁转身踏上自己的药路。':'尹照川带上阵图，随修阵队出山。',goldenDepart?'共同测读留在古渡，她已往下游复测；信路仍通。':'各自的远行已经开始，三个月后可按约相见。']:['熟悉的身影来到约定之处。','新图在两人之间展开，各自走过的路有了新的记号。',goldenMeet?'苏婉宁已赴约；下一步可商议侧堤实测的分工。':'重逢与修行所得已经记下，你们仍有各自的道途。']};
  }
  const manuals = ['spring', 'blade', 'breath'] as const;
  const manual = manuals.find(id => !before.journey.known.includes(id) && after.journey.known.includes(id));
  if (manual && !manuals.some(id => before.journey.known.includes(id))) return { ...actor, kind: 'manual', item: manual, title: '第一部修行功法', beats: ['书页展开，行功脉络在眼前显现。', '你循着经文辨认灵息，将法诀记下。', '功法已收录；可查看功法效果，选择主修与研习。'] };
  const relic = (['sword', 'vial'] as const).find(id => !before.journey.relics[id] && after.journey.relics[id]);
  if (relic && !before.journey.relics.sword && !before.journey.relics.vial) return { ...actor, kind: 'relic', item: relic, title: '第一件灵器', beats: ['器物落入掌中，灵纹渐次亮起。', '你拂过器身，辨认其中的灵息。', '灵器已收入储物袋；装配后才会在修行与交锋中生效。'] };
}
