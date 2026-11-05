import { foundationSpeakerFoot } from '../scene2d/actor-anchors';
import type { Destination } from './state';
import type { Point } from '../scene2d/navigation';
/** Conservative foreground foot positions. No raw hotspot/sky coordinates or world time. */
export function foundationApproachPoint(location:Destination,object:string):Point {
 const local:Record<string,Point>={'sect-handover':{x:51,y:86},'well-marks':{x:54,y:86},'foreign-ledger':{x:54,y:86},'home-letter':{x:63,y:88}};
 if(local[object])return {...local[object]};
 if(object==='prepare')return {x:24,y:88};
 // The estate's water channel occupies the right foreground; its path leaves to the left.
 if(object==='exit')return location==='estate'?{x:10,y:86}:{x:82,y:88};
 if(object==='road')return location==='estate'?{x:18,y:86}:{x:64,y:88};
 if(object==='pact')return {x:52,y:88};
 return {x:foundationSpeakerFoot.x-9,y:foundationSpeakerFoot.y};
}

/** Arrival feet follow the route direction; closing a map without moving does not reset feet. */
export function foundationArrivalPoint(from:Destination,to:Destination):Point {
 const east:Record<Destination,number>={home:0,ferry:1,inn:2,snow:3,estate:4,frontier:5};
 if(to==='estate')return {x:18,y:86};
 return {x:east[from]>east[to]?82:24,y:88};
}
