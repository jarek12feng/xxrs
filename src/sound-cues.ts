// Synthesized accents share the existing mute, effect volume and voice lifecycle.
export const soundCues = {
  failure: { notes: [293.66, 220], wave: "sine", duration: 0.8, spacing: 0.18 },
  death: { notes: [146.83, 110], wave: "sine", duration: 2, spacing: 0.5 },
  rebirth: {
    notes: [146.83, 293.66, 440, 587.33],
    wave: "sine",
    duration: 1.4,
    spacing: 0.3,
  },
  reunion: {
    notes: [293.66, 369.99, 440],
    wave: "sine",
    duration: 1.2,
    spacing: 0.2,
  },
  closure: {
    notes: [440, 369.99, 293.66],
    wave: "sine",
    duration: 1.8,
    spacing: 0.3,
  },
  work: { notes: [146.83], wave: "triangle", duration: 0.2, spacing: 0 },
  gather: { notes: [587.33], wave: "sine", duration: 0.4, spacing: 0 },
  cultivate: {
    notes: [146.83, 220],
    wave: "sine",
    duration: 1.4,
    spacing: 0.15,
  },
  meditate: { notes: [880, 1174.66], wave: "sine", duration: 1, spacing: 0.22 },
  study: { notes: [587.33], wave: "sine", duration: 0.3, spacing: 0 },
  rest: { notes: [220, 293.66], wave: "sine", duration: 1.2, spacing: 0.2 },
  promotion: {
    notes: [293.66, 440, 587.33, 880],
    wave: "sine",
    duration: 1,
    spacing: 0.2,
  },
  upgrade: {
    notes: [293.66, 440, 587.33],
    wave: "sine",
    duration: 0.8,
    spacing: 0.14,
  },
  breakthrough: {
    notes: [146.83, 220, 293.66, 440, 587.33],
    wave: "sine",
    duration: 1.4,
    spacing: 0.2,
  },
  medicine: {
    notes: [440, 587.33],
    wave: "sine",
    duration: 0.8,
    spacing: 0.16,
  },
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
