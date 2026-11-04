import type { State, Intent } from "../src/core";
/** Public-command audit path. Does not inject rewards or cultivated values. */
export function finishSpiritManual(player: { readonly state: State; send: (i: Intent)=>unknown }) {
 if(player.state.spirit.manual==='learned')return;
 if(player.state.spirit.manual==='none') {
  while(player.state.injury>2) player.send({type:'advance',activity:'rest',months:1});
  while(player.state.spirit.trauma) player.send({type:'spirit',action:{kind:'recover'}});
  for(let i=0;player.state.sense<12;i++){
   if(i>12)throw Error('Spirit preparation stalled');
   player.send({type:'advance',activity:'meditate',months:1});
  }
  player.send({type:'spirit',action:{kind:'enter',source:'well',preparation:'self'}});
  if(!player.state.spirit.trial)throw Error('Cannot enter well spirit trial');
  for(const move of ['discern','guard','reach','discern'] as const)player.send({type:'spirit',action:{kind:'move',move}});
  if(String(player.state.spirit.manual)!=='found')throw Error('Spirit manual not earned');
 }
 player.send({type:'spirit',action:{kind:'study'}});
 if(String(player.state.spirit.manual)!=='learned')throw Error('Spirit study failed');
}
