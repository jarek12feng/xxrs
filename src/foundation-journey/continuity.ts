import type { State } from '../world';
/** Recall only the first actually completed shared route, not whichever place was visited last. */
export function sharedRouteRecall(s: State): string {
  const q=s.foundationJourney,h=q.heroine;
  if(s.social.gender!=='male' || h.route==='none')return '';
  const careful=q.growth.routes[h.route].choice==='careful';
  return h.route==='estate'
    ? careful?'苏婉宁把药庄保根时留下的窄路标点接进新图，仍避开药工的井口。':'苏婉宁在药庄减产的药床旁留出禁采标记，没有把取药后的空地画成新通路。'
    : h.route==='snow'
      ? careful?'苏婉宁沿用雪线缓坡试过的绳距，在图上逐段标出背粮人也能踩稳的落点。':'苏婉宁保留雪线风口的避风记号，特别注明抢行的路不能直接交给背粮药工。'
      : careful?'苏婉宁沿用古道修复支点后的双向标记，重新试过归绳能否来回受力。':'苏婉宁把古道单向裂隙画成止步缺口，接应另循备用路，没有反悔先前已经验过的外缘。';
}
export function homeCouncil(s: State): string {
  const p=s.secretPact;
  return (s.journey.branch==='none'
    ? '听松以合作道友的身份请你交接归山见闻，名册没有添上你的宗籍。'
    : '温蘅收下行路记录，让新弟子接过日常护药名册，请你以亲历指点他们。')+
    (p.story.identity==='accept'?'你记得自己答应的是方便时接应，没有许下放弃远行的任职。':p.story.identity==='decline'?'师长仍记得你婉拒固定职责，没有再以任用留你。':'师长询问你是否愿意承担护药合作；你可以另行商议，也可以继续远行。')+
    '掌门陆怀真在归山交接时正式见你：“听松有完整凝丹传承，凝婴资料却还残缺。后面的路，需要你亲自去问。”他让你先核对凝丹主药、丹药与静室的准备；内比争取与合作药圃取药是两条路，不要求两边都做。';
}
