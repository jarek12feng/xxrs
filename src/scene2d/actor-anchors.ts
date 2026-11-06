import type { RoadStage } from '../road';
/** Feet are centered; sprite widths must never shift interaction targets. */
export function roadSpeakerFoot(stage:RoadStage) {
  return stage==='pass' ? {x:62,y:85}
    : stage==='beyond'||stage==='lookout' ? {x:59,y:87}
    : stage==='camp' ? {x:51,y:88} : {x:44,y:85};
}
export const mistSpeakerFoot={x:36,y:87};
export const foundationSpeakerFoot={x:47,y:88};
