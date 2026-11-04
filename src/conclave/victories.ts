import type { State } from '../world';
import type { Move } from '../combat';
export interface BattleEffort { moves:Record<Move,number>; herbs:number }
export interface Victory extends BattleEffort { kind:'contest'|'vault';index:number;turns:number }
export const freshEffort=():BattleEffort=>({moves:{guard:0,strike:0,discern:0},herbs:0});
export function validEffort(value:unknown,turn:number):value is BattleEffort {
 const e=value as BattleEffort;
 return !!e && !!e.moves && ['guard','strike','discern'].every(k=>Number.isSafeInteger(e.moves[k as Move])&&e.moves[k as Move]>=0&&e.moves[k as Move]<=18)
  && Object.values(e.moves).length===3 && e.moves.guard+e.moves.strike+e.moves.discern===turn
  && Number.isSafeInteger(e.herbs)&&e.herbs>=0&&e.herbs<=e.moves.guard;
}
export function victoryStyle(v:Victory){
 if(v.moves.discern>v.moves.guard && v.moves.discern>=v.moves.strike)return 'reading';
 if(v.moves.guard>=v.moves.strike && v.moves.guard>=v.moves.discern)return 'steady';
 return 'assault';
}
export function victoryMemory(v:Victory){
 const styles={reading:'辨清来势后拆招',steady:'稳住阵脚逐步推进',assault:'抓住空隙主动抢攻'};
 const names=v.kind==='contest'?['顾沧遥','纪闻霜','程砚舟']:['归潮外殿','照神阵枢'];
 return `${names[v.index]}：${v.turns} 合取胜，反击 ${v.moves.strike}、守势 ${v.moves.guard}、辨影 ${v.moves.discern}，耗草 ${v.herbs}。你以${styles[victoryStyle(v)]}取胜。`;
}
/** Earned, small forward benefits; no extra reward button or compulsory third duel. */
export function conclaveLessons(s:State){
 const records=s.conclave.victories ?? [];
 const gu=records.find(v=>v.kind==='contest' && v.index===0);
 const ji=records.find(v=>v.kind==='contest' && v.index===1);
 const steady=gu && victoryStyle(gu)==='steady';
 const assault=gu && victoryStyle(gu)==='assault';
 const reading=(gu && victoryStyle(gu)==='reading') || (ji && victoryStyle(ji)==='reading');
 return {shelterHp:steady?4:0,currentDamage:assault?2:0,herbsSaved:reading?1:0,
  gu:gu?`顾沧遥记得你${victoryStyle(gu)==='steady'?'守住石台的耐心，教你借背潮岩壁稳住气机；走背潮石道时起始气势再 +4':victoryStyle(gu)==='assault'?'主动抢攻的打法，与你拆解迎潮发力；走主流时反击伤害再 +2':'辨印拆招的办法，将你的观察交给叶问苓校正潮图；每层行装少耗灵草 1'}。`:'',
  ye:reading?'叶问苓把你斗法中辨清虚实的记录补入潮图，避开一处扰神岔流；每层行装少耗灵草 1，不叠加。':ji?'叶问苓翻看你与纪闻霜的交锋记录，提醒你按自己的气势与补给选择潮路。':'',};
}
