import { STAGES, getFileDetail, isThin, type AudioFile } from '../data/sample';
import type { Tone } from '../ui/primitives';

/** A processed file whose report found no needs (short or general recording). */
export const isLittleDetail = (f: AudioFile) => f.status === 'done' && isThin(getFileDetail(f));

export function statusLabel(f: AudioFile) {
  if (isLittleDetail(f)) return 'Little detail';
  if (f.status === 'done') return 'Report ready';
  return STAGES[f.stage - 1].active;
}

export function statusTone(f: AudioFile): Tone {
  if (isLittleDetail(f)) return 'warn';
  return f.status === 'done' ? 'brand' : 'info';
}

/** State of each pipeline step for one file. */
export function stepStates(f: AudioFile) {
  return STAGES.map((s) => ({
    ...s,
    state: f.status === 'done' || s.stage < f.stage ? ('done' as const) : s.stage === f.stage ? ('active' as const) : ('todo' as const),
  }));
}
