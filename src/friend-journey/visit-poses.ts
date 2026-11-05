/** Read-only atlas selection. Coordinates align the boots, not the moving hands. */
export const visitPoseAtlas = '/art/friend-journey/su-visit-poses-v1.png';
export type VisitPose = 'greet' | 'unfold' | 'trace' | 'close' | 'injured';
export function visitPose(phase: 'idle' | 'unfold' | 'trace' | 'acknowledge', visited: boolean, supplied: boolean): VisitPose {
  if (phase === 'unfold' || phase === 'trace') return phase;
  if (phase === 'acknowledge') return 'close';
  return !supplied ? 'injured' : visited ? 'close' : 'greet';
}
export const visitPoseFrames: Record<VisitPose, { x: number; label: string }> = {
  greet: { x: 45, label: '苏婉宁抬头迎你，手中收着测记' },
  unfold: { x: 450, label: '苏婉宁双手展开测记' },
  trace: { x: 860, label: '苏婉宁指着测记上的潮路' },
  close: { x: 1295, label: '苏婉宁将测记收拢' },
  injured: { x: 1740, label: '苏婉宁扶着伤臂休养' },
};
