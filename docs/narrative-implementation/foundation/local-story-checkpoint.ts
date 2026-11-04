import { journeyCheckpoint, journeyPlayer } from '../../../tools/foundation-journey-checkpoint';
import { foundationMapCheckpoint } from '../../../tools/foundation-sites-checkpoint';

/** Development only: public commands, memory only, no player save access. */
export function localStoryCheckpoint(place: 'home'|'ferry'|'snow'|'ending') {
  if(place === 'snow') {
    const p = journeyPlayer(foundationMapCheckpoint());
    p.act({kind:'travel',destination:'snow'});
    return p.state;
  }
  const p = journeyPlayer(journeyCheckpoint('male', place === 'ending'));
  if(place === 'ferry') {
    p.act({kind:'travel',destination:'ferry'});
    p.fight('well');p.act({kind:'inherit',technique:'spring'});
  }
  if(place === 'ending') {
    p.fight('culmination');p.cultivate(600);
    p.act({kind:'travel',destination:'home'});p.act({kind:'epilogue'});
  }
  return p.state;
}
