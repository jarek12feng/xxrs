// Synthesized accents share the existing mute, effect volume and voice lifecycle.
export const soundCues = {
  step: { notes: [330], wave: "sine", duration: 0.65, spacing: 0.12 },
  discovery: {
    notes: [440, 659.25],
    wave: "sine",
    duration: 0.65,
    spacing: 0.12,
  },
  choice: {
    notes: [392, 523.25, 659.25],
    wave: "sine",
    duration: 0.65,
    spacing: 0.12,
  },
  strike: {
    notes: [740, 370],
    wave: "triangle",
    duration: 0.18,
    spacing: 0.04,
  },
  guard: {
    notes: [220, 660],
    wave: "triangle",
    duration: 0.25,
    spacing: 0.025,
  },
  discern: { notes: [523, 784], wave: "sine", duration: 0.4, spacing: 0.08 },
  hurt: { notes: [110, 82], wave: "triangle", duration: 0.2, spacing: 0.05 },
  victory: {
    notes: [392, 494, 587, 784],
    wave: "sine",
    duration: 0.5,
    spacing: 0.1,
  },
} satisfies Record<
  string,
  { notes: number[]; wave: OscillatorType; duration: number; spacing: number }
>;
export type SoundCue = keyof typeof soundCues;
