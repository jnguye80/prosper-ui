import { useCallback, useEffect, useReducer, useState } from 'react';
import { AuthScreen, type User } from '../auth/AuthScreen';
import { UserMenu } from '../auth/UserMenu';
import { Logo } from '../ui/icons';
import { Toast } from '../ui/primitives';
import { useToast } from '../ui/useToast';
import { WebContext } from './context';
import { initialState, reducer, type Screen } from './store';
import { AssessmentsPage } from './AssessmentsPage';
import { AssessmentPage } from './AssessmentPage';
import { FilePage } from './FilePage';
import { ReportPage } from './ReportPage';
import { NewAssessmentModal } from './Modals';
import { UploadPage } from './UploadPage';

/**
 * Prototype stand-in for polling Step Functions: how often processing files advance one stage.
 * In the real app the front end would poll (or subscribe to) pipeline status instead.
 */
const PIPELINE_TICK_MS = 5000;
const REPORT_WRITE_MS = 1800;

export function WebApp() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState<User | null>(null);
  const toast = useToast();

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'tick' }), PIPELINE_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const loadingReports = Object.entries(state.reports).filter(([, r]) => r.loading).map(([id]) => id).join(',');
  useEffect(() => {
    if (!loadingReports) return;
    const ids = loadingReports.split(',');
    const timer = window.setTimeout(() => ids.forEach((assessmentId) => dispatch({ type: 'finishReport', assessmentId })), REPORT_WRITE_MS);
    return () => window.clearTimeout(timer);
  }, [loadingReports]);

  const go = useCallback((screen: Screen) => {
    dispatch({ type: 'go', screen });
    window.scrollTo({ top: 0 });
  }, []);
  const assessment = useCallback((id: string) => state.assessments.find((a) => a.id === id) ?? state.assessments[0], [state.assessments]);

  const signOut = useCallback(() => {
    setUser(null);
    dispatch({ type: 'go', screen: { name: 'assessments' } });
  }, []);

  if (!user) {
    return (
      <AuthScreen
        onSignIn={(u) => {
          setUser(u);
          dispatch({ type: 'go', screen: { name: 'assessments' } });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const s = state.screen;
  return (
    <WebContext.Provider value={{ state, dispatch, toast: toast.show, go, assessment }}>
      <div className="min-h-full bg-ground font-sans text-ink">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex min-h-[60px] max-w-[1200px] flex-wrap items-center gap-x-8 gap-y-3 px-4 py-2 sm:px-8">
            <button type="button" onClick={() => go({ name: 'assessments' })} className="flex cursor-pointer items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-brand" aria-label="ACoRN — all assessments">
              <Logo />
              <span className="text-[17px] font-bold tracking-[0.02em]">ACoRN</span>
            </button>
            <nav aria-label="Primary" className="flex flex-1 flex-wrap gap-1">
              <button
                type="button"
                aria-current="page"
                onClick={() => go({ name: 'assessments' })}
                className="h-[38px] cursor-pointer rounded-lg bg-brand-soft px-3 text-sm font-semibold text-brand-dark focus-visible:outline-2 focus-visible:outline-brand"
              >
                Assessments
              </button>
            </nav>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">Synthetic sample data</span>
              <UserMenu user={user} onSignOut={signOut} />
            </div>
          </div>
        </header>

        {s.name === 'assessments' && <AssessmentsPage />}
        {s.name === 'assessment' && <AssessmentPage assessmentId={s.assessmentId} />}
        {s.name === 'file' && <FilePage assessmentId={s.assessmentId} fileId={s.fileId} tab={s.tab} />}
        {s.name === 'report' && <ReportPage assessmentId={s.assessmentId} />}
        {s.name === 'upload' && <UploadPage assessmentId={s.assessmentId} />}

        {state.modal === 'new-assessment' && <NewAssessmentModal />}
        <Toast message={toast.message} />
      </div>
    </WebContext.Provider>
  );
}
