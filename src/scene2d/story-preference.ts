import type { State } from '../core';
import { storyChapters, type StoryChapter } from './story-routing';
const key = 'xxrs-story-view-v1';
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
// A view preference is bound to the saved snapshot, never used as game progress.
function snapshot(s: State) {
  return JSON.stringify([s.name, s.month, s.seed, s.realm, s.seen.at(-1)]);
}
export function readStoryPreference(s: State, storage: StoragePort): string {
  try {
    const value = JSON.parse(storage.getItem(key) || 'null');
    return value?.snapshot === snapshot(s) && storyChapters(s).some(c => c.id === value.chapter)
      ? value.chapter : '';
  } catch { return ''; }
}
export function writeStoryPreference(s: State, chapter: StoryChapter, storage: StoragePort) {
  try { storage.setItem(key, JSON.stringify({snapshot: snapshot(s), chapter})); } catch { /* Storage preferences must never block play. */ }
}
