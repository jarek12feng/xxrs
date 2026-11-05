/** Public-command isolated fixture, never a player save or continuous human playthrough. */
import { goldenLateCheckpoint, finishGoldenCompletion } from './golden-completion-checkpoint';
export function nascentCrossingCheckpoint() {
  return finishGoldenCompletion(goldenLateCheckpoint()).checkpoints.celebration!;
}
