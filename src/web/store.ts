import { ASSESSMENTS, INITIAL_FILES, INITIAL_REPORTS, type Assessment, type AudioFile, type Stage } from '../data/sample';

export type Screen =
  | { name: 'assessments' }
  | { name: 'assessment'; assessmentId: string }
  | { name: 'file'; assessmentId: string; fileId: string; tab: 'report' | 'transcript' }
  | { name: 'report'; assessmentId: string }
  | { name: 'upload'; assessmentId: string };

export interface ReportState {
  loading: boolean;
  /** File IDs the report was written from. */
  fileIds: string[];
  generated: string;
}

export interface WebState {
  screen: Screen;
  assessments: Assessment[];
  files: Record<string, AudioFile[]>;
  reports: Record<string, ReportState>;
  modal: null | 'new-assessment';
}

export const initialState: WebState = {
  screen: { name: 'assessments' },
  assessments: ASSESSMENTS,
  files: INITIAL_FILES,
  reports: Object.fromEntries(
    INITIAL_REPORTS.map((id) => [id, { loading: false, fileIds: INITIAL_FILES[id].map((f) => f.id), generated: 'Sep 27, 2026' }]),
  ),
  modal: null,
};

export type Action =
  | { type: 'go'; screen: Screen }
  | { type: 'tick' }
  | { type: 'openModal'; modal: 'new-assessment' }
  | { type: 'closeModal' }
  /** A finished upload joins the assessment and starts processing. The reducer assigns the file ID. */
  | { type: 'addFile'; assessmentId: string; file: Omit<AudioFile, 'id'> }
  | { type: 'newAssessment'; assessment: Omit<Assessment, 'id'> }
  | { type: 'startReport'; assessmentId: string }
  | { type: 'finishReport'; assessmentId: string };

function nextFileNumber(files: Record<string, AudioFile[]>) {
  return Math.max(...Object.values(files).flat().map((f) => parseInt(f.id.slice(2), 10))) + 1;
}
const fileId = (n: number) => `C-${String(n).padStart(4, '0')}`;

export function reducer(state: WebState, action: Action): WebState {
  switch (action.type) {
    case 'go':
      return { ...state, screen: action.screen, modal: null };

    case 'tick': {
      // Prototype stand-in for polling pipeline status: every processing file moves one stage.
      let changed = false;
      const files: WebState['files'] = {};
      for (const [id, list] of Object.entries(state.files)) {
        files[id] = list.map((f) => {
          if (f.status !== 'run') return f;
          changed = true;
          const next = (f.stage + 1) as Stage;
          return next >= 5 ? { ...f, stage: 5, status: 'done' } : { ...f, stage: next };
        });
      }
      return changed ? { ...state, files } : state;
    }

    case 'openModal':
      return { ...state, modal: action.modal };
    case 'closeModal':
      return { ...state, modal: null };

    case 'addFile': {
      const added: AudioFile = { ...action.file, id: fileId(nextFileNumber(state.files)) };
      return {
        ...state,
        files: { ...state.files, [action.assessmentId]: [added, ...(state.files[action.assessmentId] ?? [])] },
      };
    }

    case 'newAssessment': {
      const id = `new-${state.assessments.length + 1}`;
      return {
        ...state,
        modal: null,
        assessments: [{ id, ...action.assessment }, ...state.assessments],
        files: { ...state.files, [id]: [] },
        screen: { name: 'assessment', assessmentId: id },
      };
    }

    case 'startReport': {
      const done = (state.files[action.assessmentId] ?? []).filter((f) => f.status === 'done');
      return {
        ...state,
        screen: { name: 'report', assessmentId: action.assessmentId },
        reports: { ...state.reports, [action.assessmentId]: { loading: true, fileIds: done.map((f) => f.id), generated: 'just now' } },
      };
    }
    case 'finishReport': {
      const r = state.reports[action.assessmentId];
      return r ? { ...state, reports: { ...state.reports, [action.assessmentId]: { ...r, loading: false } } } : state;
    }
  }
}

export function fileCounts(files: AudioFile[]) {
  const done = files.filter((f) => f.status === 'done').length;
  return { total: files.length, done, processing: files.length - done };
}
