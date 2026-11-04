import { integer } from "./validation";
/** The existing state-seeded generator. Pure: callers explicitly persist the returned seed. */
export function draw(seed: number) {
  integer(seed, "seed", 0, 0xffffffff);
  let x = seed;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  const nextSeed = x >>> 0 || 1;
  return { seed: nextSeed, value: nextSeed / 4294967296 };
}
