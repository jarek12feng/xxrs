import type { Deadline } from "../timeline";
export function seaSchedule(s: {
  outerSea?: { notice?: number | null; reminded?: boolean };
}): Deadline[] {
  const sea = s.outerSea;
  return sea?.notice == null
    ? []
    : [{ id: "conclave", month: sea.notice + 600, handled: !!sea.reminded }];
}
