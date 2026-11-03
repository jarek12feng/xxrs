import { expect,it } from 'vitest';
import { validState } from '../src/core';
import { foundationSiteCheckpoint } from '../tools/foundation-sites-checkpoint';
import { foundationSiteState } from '../src/foundation-journey/scene-performance';
it.each(['estate','snow'] as const)('public commands reach the %s completed site',site=>{
 const s=foundationSiteCheckpoint(site,true);
 expect(validState(s)).toBe(true);
 expect(s.foundationJourney.location).toBe(site);
 expect(s.foundationJourney.sides[site].step).toBe(2);
 expect(s.foundationJourney.won).toContain(site);
 expect(foundationSiteState(s,'journey')[site]).toBe(true);
});
