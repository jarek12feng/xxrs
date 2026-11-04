/** Read-only scene contract. No realm, save, combat or clock dependencies. */
export interface TribulationPresentation {
  phase: {
    title: string;
    turn: number;
    signal: string;
    tell: string;
    hp: number;
    maxHp: number;
    pressure: number;
    maxPressure: number;
    color: string;
  } | null;
  result: {
    serial: number;
    label: string;
    damage: number;
    incoming: number;
    ward: boolean;
    hero: string;
    color: string;
  } | null;
  hero: string;
  cleared: boolean;
  victoryTitle: string;
  victoryText: string;
  assets: { strike: string; impact: string; ward: string };
}
