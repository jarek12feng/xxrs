import {expect,it} from 'vitest';
import {travelPlaybackDuration as duration} from '../src/wayfaring/playback';
it('uses route distance and travel speed with bounded real playback time',()=>{
 for(const mode of ['walk','flight','sail'] as const) {
  expect(duration(25,mode,1)).toBeGreaterThan(duration(15,mode,1));
  expect(duration(1200,mode,1)).toBeGreaterThan(duration(25,mode,1));
  expect(duration(1e12,mode,1)).toBe(18000);
 }
 expect(duration(1200,'flight',1)).toBeLessThan(duration(1200,'walk',1));
 expect(duration(1200,'flight',2)).toBeLessThan(duration(1200,'flight',1));
 expect(duration(0,'walk',0)).toBe(4000);
 expect(duration(NaN,'walk',0)).toBe(4000);
});
