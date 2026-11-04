import type { State } from '../world';
import type { Move } from '../combat';
import { rivals, wardens } from './content';
export function conclavePhase(s: State) {
  const d=s.conclave.duel;
  if(!d)return null;
  const late=d.enemy <= (d.kind==='contest'?rivals:wardens)[d.index]!.hp/2;
  let title='',next='',responses:Move[]=['guard','discern'],mode='',sealed='';
  if(d.kind==='contest' && d.index===0){
    mode=late?'palm':'seal';
    const open=d.effect===(late?'guard':'discern');
    title=late?(open?'掌势已接住':'散印推掌'):(open?'印隙已明':'护势未散');
    next=late?(open?'上合守势稳住气机，本合可借势反击。':'他已散去护印；稳守接掌可为下合反击蓄势。'):(open?'本合可沿印隙反击；气势降至一半后会散印推掌。':'气势降至一半后会散印推掌；当前辨影可打开印隙。');
    responses=open?['strike','guard']:late?['guard','strike']:['guard','discern'];
  }else if(d.kind==='contest' && d.index===1){
    mode=late?(['quick','recover','feint'][d.turn%3]!):(d.turn%2===0?'windup':'release');
    const rows:Record<string,[string,string,Move[]]>={
      windup:['霜剑蓄势','下合落剑；抢攻可打断，辨影可留出反击机会。',['strike','discern']],
      release:['剑光落下','先前应对决定剑势；半血后改用短剑连势。',d.effect==='discern'?['strike','guard']:['guard']],
      quick:['短剑近身','她已弃长蓄势；本合接近身剑，下一合会回气。',['guard','strike']],
      recover:['回剑调息','本合可追击或辨影；下一合会以霜影试探。',['strike','discern']],
      feint:['霜影试探','辨清虚实或稳住阵脚；下一合再次近身。',['discern','guard']],
    };[title,next,responses]=rows[mode]!;
  }else if(d.kind==='contest'){
    mode=late && d.effort?'study':'repeat';
    const counts=d.effort?.moves;
    sealed=late && counts ? (['strike','guard','discern'] as Move[]).reduce((a,b)=>counts[b]>counts[a]?b:a) : d.effect;
    const names:Record<string,string>={strike:'反击',guard:'守势',discern:'辨影'};
    title=sealed?`封锁${names[sealed]}`:'试探起手';
    next=mode==='study'?'他开始封锁本场用得最多的招式；同数时先封反击，再守势。':'他先封上一式；气势过半后会针对本场最常用的招式。';
    responses=(['guard','strike','discern'] as Move[]).filter(m=>m!==sealed);
  }else{
    const period=late?2:3,surge=d.turn%period===period-1;
    mode=surge?'surge':'gather';
    title=surge?(d.index?'阵压将至':'潮击将至'):`${d.index?'阵压':'潮击'}前还有 ${period-1-d.turn%period} 合`;
    next=late?'阵核过半，潮势加快至每两合；先前辨阵或稳守仍可铺垫。':'阵核过半后潮势会加快；提前辨阵、接潮或趁隙抢攻。';
    responses=surge?(d.effect==='discern'?['guard','strike']:['guard','discern']):['strike','discern'];
  }
  return {late,title,next,responses,mode,sealed};
}
