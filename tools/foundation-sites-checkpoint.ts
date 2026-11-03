import { journeyCheckpoint,journeyPlayer } from './foundation-journey-checkpoint';
// Development-only checkpoints: earn outcomes through the public commands, never save them.
export function foundationSiteCheckpoint(site:'estate'|'snow',completed:boolean){
 const p=journeyPlayer(journeyCheckpoint());
 p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique:'spring'});p.fight('exit');p.act({kind:'ferryOutcome',outcome:'escort'});
 p.act({kind:'travel',destination:site});p.act({kind:'sideInvestigate',side:site});
 if(completed)p.fight(site);
 return p.state;
}
/** One continuous shared-task handoff, stopped before the player's map choice. */
export function foundationMapCheckpoint(){
 const p=journeyPlayer(journeyCheckpoint());
 p.act({kind:'travel',destination:'ferry'});p.fight('well');p.act({kind:'inherit',technique:'spring'});p.fight('exit');p.act({kind:'ferryOutcome',outcome:'escort'});
 p.cultivate(280);p.act({kind:'travel',destination:'snow'});p.act({kind:'routePrepare',route:'snow',method:'service'});p.act({kind:'routeChoose',route:'snow',choice:'careful'});p.fight('deer');
 while(p.state.herbs<6)p.send({type:'supplies'});
 p.act({kind:'routeProcess',route:'snow',method:'self'});p.act({kind:'travel',destination:'home'});
 return p.state;
}
