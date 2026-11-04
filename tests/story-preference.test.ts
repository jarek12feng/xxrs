import { expect, it } from 'vitest';
import { createGame } from '../src/core';
import { advanceStoryPreference, readStoryPreference, writeStoryPreference } from '../src/scene2d/story-preference';
it('restores a view only for the matching saved snapshot, without mutating progress', () => {
 const s=createGame('行旅','wood',42);s.adventure.step='done';
 let raw:string|null=null;const storage={getItem:()=>raw,setItem:(_:string,v:string)=>{raw=v}};
 const before=structuredClone(s);
 writeStoryPreference(s,'qi',storage);
 expect(readStoryPreference(structuredClone(s),storage)).toBe('qi');
 expect(s).toEqual(before);
 expect(readStoryPreference({...s,month:s.month+1},storage)).toBe('');
 expect(readStoryPreference({...s,name:'另一人'},storage)).toBe('');
 raw='{bad';expect(readStoryPreference(s,storage)).toBe('');
});
it('blocked preference storage cannot block play',()=>{
 const s=createGame('行旅','wood',42);const storage={getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}};
 expect(readStoryPreference(s,storage)).toBe('');
 expect(()=>writeStoryPreference(s,'opening',storage)).not.toThrow();
});
it('keeps the journey through saved cave actions without accepting another loaded snapshot', () => {
 const s=createGame('行旅','wood',42);s.realm=1;s.adventure.step='done';
 let raw:string|null=null;const storage={getItem:()=>raw,setItem:(_:string,v:string)=>{raw=v}};
 writeStoryPreference(s,'road',storage);
 const after={...s,month:s.month+3,seed:s.seed+1};
 advanceStoryPreference(s,after,storage);
 expect(readStoryPreference(after,storage)).toBe('road');
 expect(readStoryPreference(s,storage)).toBe('');
 const unrelated={...after,name:'另一人'};
 advanceStoryPreference(unrelated,{...unrelated,month:999},storage);
 expect(readStoryPreference(after,storage)).toBe('road');
 const golden={...after,realm:2 as const};
 advanceStoryPreference(after,golden,storage);
 expect(readStoryPreference(golden,storage)).toBe('');
});
