import { audioUrl } from "./foundation-audio";
import type { SoundCue } from "./sound-cues";

// Bounded, gesture-gated file voices. Never reads game state or delays saving.
export function createFileEffects(
  factory: (url: string) => HTMLAudioElement = (url) => new Audio(url),
) {
  const voices = new Set<HTMLAudioElement>();
  let enabled = false,
    unlocked = false,
    hidden = false,
    disposed = false,
    volume = 0;
  const active = () =>
    enabled && unlocked && !hidden && !disposed && volume > 0;
  function remove(audio: HTMLAudioElement) {
    if (!voices.delete(audio)) return;
    audio.onended = audio.onerror = null;
    audio.muted = true;
    audio.volume = 0;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
  function stop() {
    for (const audio of voices) remove(audio);
  }
  return {
    settings(on: boolean, level: number) {
      enabled = on;
      volume = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
      if (!active()) stop();
      else for (const audio of voices) audio.volume = volume;
    },
    unlock() {
      unlocked = true;
    },
    hidden(value: boolean) {
      hidden = value;
      if (hidden) stop();
    },
    cue(kind: SoundCue) {
      if (!active()) return;
      if (voices.size >= 6) remove(voices.values().next().value!);
      try {
        const audio = factory(audioUrl(kind));
        audio.volume = volume;
        audio.preload = "auto";
        voices.add(audio);
        audio.onended = audio.onerror = () => remove(audio);
        void audio
          .play()
          .then(() => {
            if (!voices.has(audio) || !active()) audio.pause();
          })
          .catch(() => remove(audio));
      } catch {
        /* Missing audio must not interrupt the game. */
      }
    },
    dispose() {
      disposed = true;
      stop();
    },
  };
}
