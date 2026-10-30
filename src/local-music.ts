// Original file score, loaded after app mount; mute/gesture/visibility gates apply.
export type MusicCue = "home" | "trial" | "journey" | "vista" | "mystery";
export const musicNames: Record<MusicCue, string> = {
  home: "听松入定 · 洞府与归家",
  trial: "护路破阵 · 交锋",
  journey: "青山同行 · 山外行路",
  vista: "云海归灯 · 远望",
  mystery: "渡口未寄 · 雨夜与旧阵",
};
export function sceneMusic(name: string, shrineRelit = false): MusicCue {
  if (name === "再见那座山祠" && shrineRelit) return "home";
  const cues: Record<string, MusicCue> = {
    雨夜渡口: "mystery",
    一封求助信: "mystery",
    雾林旧道: "mystery",
    废弃山祠: "trial",
    青嶂关: "trial",
    雾海回声阵: "trial",
    山口行营: "journey",
    灯下分路: "journey",
    雾生旧药圃: "journey",
    云外长路: "vista",
    云栈旅亭: "vista",
    旅亭来信: "mystery",
    不该到来的信: "mystery",
    无人的废驿: "mystery",
    灯还在等人: "mystery",
    再见那座山祠: "mystery",
    有人等你归来: "home",
  };
  return cues[name] ?? "home";
}
export function createMusicPlayer(
  factory: (url: string) => HTMLAudioElement = (url) => new Audio(url),
  report: (message: string) => void = () => {},
  playback: (cue: MusicCue | null) => void = () => {},
) {
  type Voice = {
    audio: HTMLAudioElement;
    cue: MusicCue;
    gain: number;
    pending: boolean;
  };
  const voices = new Set<Voice>();
  let selected: MusicCue = "home",
    enabled = false,
    hidden = false,
    unlocked = false,
    disposed = false;
  let volume = 0.45,
    ducked = false,
    lastTime = Date.now();
  let failed: MusicCue | undefined;
  const active = () => enabled && unlocked && !hidden && !disposed;
  function start() {
    if (
      !active() ||
      failed === selected ||
      [...voices].some((v) => v.cue === selected)
    )
      return;
    const audio = factory(
      `${import.meta.env.BASE_URL}audio/original-v1/${selected}.wav`,
    );
    const voice: Voice = { audio, cue: selected, gain: 0, pending: true };
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    voices.add(voice);
    const fail = () => {
      if (!voices.has(voice)) return;
      failed = voice.cue;
      remove(voice);
      report("配乐暂不能播放，请再次点击开启声音。");
    };
    audio.onerror = fail;
    play(voice, fail);
  }
  function play(voice: Voice, fail: () => void) {
    const audio = voice.audio;
    void audio
      .play()
      .then(() => {
        if (!voices.has(voice) || !active()) {
          audio.pause();
          return;
        }
        voice.pending = false;
        playback(voice.cue);
        report("");
      })
      .catch(fail);
  }
  function remove(v: Voice) {
    voices.delete(v);
    v.audio.muted = true;
    v.audio.volume = 0;
    v.audio.pause();
    v.audio.onerror = null;
    v.audio.removeAttribute("src");
    v.audio.load();
  }
  function tick() {
    const dt = Math.min(0.1, (Date.now() - lastTime) / 1000);
    lastTime = Date.now();
    if (!active()) return;
    const ready = [...voices].some((v) => v.cue === selected && !v.pending);
    for (const v of voices) {
      const target =
        v.cue === selected || !ready ? volume * (ducked ? 0.3 : 1) : 0;
      // Smooth dialogue attenuation (0.3 s), gentle restoration and crossfades (~2 s).
      const tau = ducked && v.cue === selected ? 0.3 : 0.65;
      v.gain += (target - v.gain) * (1 - Math.exp(-dt / tau));
      v.audio.volume = Math.max(0, Math.min(1, v.gain));
      if (ready && v.cue !== selected && v.gain < 0.001) remove(v);
    }
  }
  const timer = setInterval(tick, 40);
  return {
    scene(cue: MusicCue) {
      if (cue !== selected) {
        selected = cue;
        failed = undefined;
        start();
      }
    },
    settings(on: boolean, level: number) {
      enabled = on;
      volume = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0.45;
      if (!on) {
        playback(null);
        for (const v of voices) remove(v);
      } else start();
    },
    duck(value: boolean) {
      ducked = value;
    },
    unlock() {
      if (disposed || !enabled || hidden) return;
      unlocked = true;
      failed = undefined;
      start();
    },
    hidden(value: boolean) {
      if (hidden === value) return;
      hidden = value;
      if (hidden) {
        playback(null);
        for (const v of voices) {
          v.audio.pause();
          v.gain = 0;
          v.audio.volume = 0;
        }
      } else if (active()) {
        for (const v of voices)
          play(v, () => {
            if (!voices.has(v)) return;
            remove(v);
            report("本地配乐已暂停，点击声音开关可重新播放。");
          });
        start();
      }
    },
    dispose() {
      disposed = true;
      playback(null);
      clearInterval(timer);
      for (const v of voices) remove(v);
    },
  };
}
