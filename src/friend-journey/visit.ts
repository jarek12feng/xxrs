import type { State } from '../world';
import { friendPresence } from './presence';
export function friendVisitQuote(s:State):string {
  if(s.realm!==2 || s.outerSea.location!=='ferry' || s.conclave.location!=='away' || s.lizhao.location!=='away')return '先循航路回到外海古渡';
  if(friendPresence(s)!=='resting')return '她此刻不在古渡休养，沿留下的信路等候近况';
  if(s.friendJourney.visitedAt!==null)return '已经当面问候过，这几日让她安心休养';
  return '';
}
export function visitFriend(s:State):void {
  s.friendJourney.visitedAt=s.month;
  for(const f of s.friendJourney.facts){
    if(f.learnedAt===null)f.learnedAt=s.month;
    if(f.confirmedAt===null)f.confirmedAt=s.month;
  }
}
export function friendVisitText(s:State):string {
  return s.friendJourney.suppliedAt!==null
    ? '苏婉宁把晒干的测记推过来：“你捎来的灵草正好用上，横流里稳住了气息，这几张图也没丢。”你看她气色尚好，便在石台边听她说了这趟见闻。她将核实过的浅滩标出，余下几日留在古渡整理。'
    : '苏婉宁轻扶着伤臂：“横流卷走几页测记，撤回时擦伤了，不过已无大碍。”你在石台边陪她说了一会儿话。她指着图上的空白说：“没看准的先留着，不能让后来人照着猜测走。”你叮嘱她先养伤，不必急着补图。';
}
export function friendSiteText(s:State):string {
  switch(friendPresence(s)){
    case 'preparing':return '堤边放着重新结好的测潮绳。驿使说，她正在备齐行装，动身前可循旧信路联系。';
    case 'away':return '堤边只留着晾绳的木架。守渡人说，她已经随药船去了侧堤外的浅滩，这会儿不在古渡。';
    case 'resting':return s.friendJourney.visitedAt!==null?friendVisitText(s):'苏婉宁站在避风的石台旁，身边摊着几页测记。你可以走近问候，亲自核实此行经过。';
    case 'departed':return '石台已经收拾干净，测潮绳也带走了。她留下去向：先回药路静修，近况仍托旧驿路送来。错过这回探望，日后仍可通信。';
    default:return '旧记号仍在，暂没有能确认她当前位置的新消息。沿原来的信路联系即可，不必冒然追赶。';
  }
}
