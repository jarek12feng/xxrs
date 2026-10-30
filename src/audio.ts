import { createLoopPlayer } from "./local-music";
import { audioUrl, type AmbientCue } from "./foundation-audio";
import type { createFileEffects } from "./file-effects";
import { soundCues, type SoundCue } from "./sound-cues";
// Procedural local soundscape. This module never reads or writes game state/RNG.
export type SoundMood = "rain" | "mist" | "warm" | "moon";
export interface SoundSettings {
  enabled: boolean;
  ambience: number;
  effects: number;
}
const defaults: SoundSettings = {
  enabled: false,
  ambience: 0.25,
  effects: 0.35,
};
export function soundSettings(raw: string | null): SoundSettings {
  try {
    const x = JSON.parse(raw || "null");
    if (!x || typeof x.enabled !== "boolean") return { ...defaults };
    const volume = (n: unknown, fallback: number) =>
      typeof n === "number" && Number.isFinite(n)
        ? Math.max(0, Math.min(1, n))
        : fallback;
    return {
      enabled: x.enabled,
      ambience: volume(x.ambience, defaults.ambience),
      effects: volume(x.effects, defaults.effects),
    };
  } catch {
    return { ...defaults };
  }
}
export function createSoundscape(
  factory: () => AudioContext = () => new AudioContext(),
  files?: ReturnType<typeof createFileEffects>,
) {
  const ambient = files
    ? createLoopPlayer<AmbientCue>("wind-chimes", audioUrl)
    : undefined;
  let ambientCue: AmbientCue | null = null;
  let ctx: AudioContext | undefined, bed: AudioBufferSourceNode | undefined;
  let filter: BiquadFilterNode | undefined, ambientGain: GainNode | undefined;
  let enabled = false,
    hidden = false,
    disposed = false,
    unlocked = false;
  let ambience = defaults.ambience,
    effects = defaults.effects;
  let mood: SoundMood = "moon";
  const voices = new Set<OscillatorNode>();
  const available = () => ctx && unlocked && enabled && !hidden && !disposed;
  function silence() {
    bed?.stop();
    bed?.disconnect();
    bed = undefined;
    filter?.disconnect();
    filter = undefined;
    ambientGain?.disconnect();
    ambientGain = undefined;
    for (const v of voices) {
      v.stop();
      v.disconnect();
    }
    voices.clear();
  }
  function atmosphere() {
    if (!available() || !ctx || bed || ambientCue || ambience === 0) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    // Deterministic synthetic noise; independent of the player's seed.
    let seed = 731;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[i] = ((seed / 4294967296) * 2 - 1) * 0.35;
    }
    bed = ctx.createBufferSource();
    bed.buffer = buffer;
    bed.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = { rain: 1600, mist: 450, warm: 220, moon: 700 }[
      mood
    ];
    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(
      ambience * 0.18,
      ctx.currentTime + 0.5,
    );
    bed.connect(filter);
    filter.connect(ambientGain);
    ambientGain.connect(ctx.destination);
    bed.start();
  }
  async function sync() {
    if (!ctx || disposed) return;
    try {
      if (enabled && !hidden && unlocked) {
        await ctx.resume();
        if (available()) atmosphere();
        else {
          silence();
          if (ctx.state !== "closed") await ctx.suspend();
        }
      } else {
        silence();
        if (ctx.state !== "closed") await ctx.suspend();
      }
    } catch {
      /* Audio unavailable must never block play or saving. */
    }
  }
  return {
    async unlock() {
      if (!enabled || hidden || disposed) return false;
      try {
        ctx ??= factory();
        unlocked = true;
        files?.unlock();
        ambient?.unlock();
        await sync();
        return ctx.state === "running";
      } catch {
        unlocked = false;
        return false;
      }
    },
    settings(next: SoundSettings) {
      files?.settings(next.enabled, next.effects);
      ambient?.settings(next.enabled && ambientCue !== null, next.ambience);
      enabled = next.enabled;
      ambience = next.ambience;
      effects = next.effects;
      if (!enabled || ambience === 0) silence();
      if (ambientGain && ctx)
        ambientGain.gain.setTargetAtTime(
          ambience * 0.18,
          ctx.currentTime,
          0.15,
        );
      void sync();
    },
    scene(next: SoundMood, cue: AmbientCue | null = null) {
      mood = next;
      ambientCue = cue;
      if (cue) {
        bed?.stop();
        bed?.disconnect();
        bed = undefined;
        filter?.disconnect();
        filter = undefined;
        ambientGain?.disconnect();
        ambientGain = undefined;
        ambient?.scene(cue);
      }
      ambient?.settings(enabled && cue !== null, ambience);
      if (unlocked) ambient?.unlock();
      void sync();
      if (filter && ctx)
        filter.frequency.setTargetAtTime(
          { rain: 1600, mist: 450, warm: 220, moon: 700 }[mood],
          ctx.currentTime,
          0.6,
        );
    },
    hidden(value: boolean) {
      hidden = value;
      files?.hidden(value);
      ambient?.hidden(value);
      void sync();
    },
    cue(kind: SoundCue) {
      if (!available() || !ctx || effects === 0 || voices.size > 8) return;
      if (files) {
        files.cue(kind);
        return;
      }
      const { notes, wave, duration, spacing } =
        soundCues[kind as keyof typeof soundCues] ?? soundCues.discovery;
      notes.forEach((frequency, i) => {
        const c = ctx!,
          voice = c.createOscillator(),
          gain = c.createGain(),
          start = c.currentTime + i * spacing;
        voice.type = wave;
        voice.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(effects * 0.09, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        voice.connect(gain);
        gain.connect(c.destination);
        voices.add(voice);
        voice.onended = () => {
          voices.delete(voice);
          voice.disconnect();
          gain.disconnect();
        };
        voice.start(start);
        voice.stop(start + duration + 0.05);
      });
    },
    dispose() {
      disposed = true;
      files?.dispose();
      ambient?.dispose();
      silence();
      void ctx?.close().catch(() => {});
    },
  };
}
