import type { State } from '../world';
import type { Move, CombatAdjustment } from '../combat';
import { conclavePhase } from './phases';
/** Visible phase, prior move and preparation feed both the quote and resolution. */
export function conclaveTactics(s:State,move:Move){
 const d=s.conclave.duel,phase=conclavePhase(s),adjustments:CombatAdjustment[]=[];
 if(!d || !phase)return {cue:'',adjustments};
 const add=(damage:number,incoming:number,note:string)=>adjustments.push({phase:'exchange',damage,incoming,note});
 if(s.conclave.preparation==='ward' && move==='guard' && d.effect==='discern')add(0,-5,'守势演练：辨后接守，承伤 −5。');
 if(s.conclave.preparation==='insight' && move==='strike' && d.effect==='discern')add(8,0,'潮阵推演：辨后抢攻，伤害 +8。');
 if(d.kind==='contest' && d.index===0){
  if(!phase.late){
   if(move==='strike')add(d.effect==='discern'?16:-12,d.effect==='discern'?-4:3,d.effect==='discern'?'沿辨出的印隙抢攻。':'护势卸力，贸然抢攻受阻。');
   if(move==='guard')add(-2,-3,'稳守消磨护势。');
  }else{
   if(move==='guard')add(-4,-8,'接住散印推掌，收敛攻势以待反击。');
   if(move==='strike')add(d.effect==='guard'?16:8,d.effect==='guard'?-4:5,d.effect==='guard'?'借上合接掌反击。':'护印已散，近身抢攻也承受掌劲。');
   if(move==='discern')add(0,-2,'辨清推掌方向，略减承伤。');
  }
 }else if(d.kind==='contest' && d.index===1){
  if(phase.mode==='windup'){
   if(move==='strike')add(7,3,'抢先打断蓄势，下合剑势减弱。');
   if(move==='discern')add(-3,-3,'辨明真剑，为下一合留出破绽。');
  }else if(phase.mode==='release'){
   add(d.effect==='discern' && move==='strike'?18:0,d.effect==='strike'?-6:d.effect==='discern'?-4:7,'霜剑落势，上一合的应对改变这一击。');
   if(move==='guard')add(-3,-8,'以守势接住蓄势剑光。');
  }else if(phase.mode==='quick'){
   if(move==='guard')add(-4,-8,'接住近身短剑，保留气势。');
   if(move==='strike')add(8,5,'与近身剑争先，以伤换攻。');
  }else if(phase.mode==='recover'){
   if(move==='strike')add(12,-2,'趁回剑调息追击。');
   if(move==='discern')add(3,-5,'追踪剑影，稳住下合应对。');
  }else{
   if(move==='strike')add(-8,5,'追逐虚影，攻势落空。');
   if(move==='discern')add(5,-5,'分清霜影，下一合仍可沿影拆招。');
   if(move==='guard')add(-3,-5,'不随虚影进退，守住自身。');
  }
 }else if(d.kind==='contest'){
  if(move===phase.sealed)add(-10,5,phase.late?'常用招式已被看穿，换势可破局。':'同式受封，可换招破局。');
  else if(phase.sealed)add(5,-2,'绕开所封招式，拆开阵隙。');
 }else if(d.index===1){
  if(phase.mode==='surge')add(0,(s.conclave.attuned?8:16)-(d.effect==='discern'?8:0)-(move==='guard'?8:0),'阵压按温养、上一合辨阵与当前守势结算。');
  if(move==='strike' && d.effect!=='discern')add(6,4,'抢攻阵枢，承担额外反震。');
 }else if(phase.mode==='surge'){
  if(move==='guard')add(-2,-5,'稳守接住潮击。');
  if(move==='strike' && d.effect!=='discern')add(5,4,'迎潮抢攻，以承伤换推进。');
 }
 return {cue:`${phase.title}。${phase.next}`,adjustments};
}
