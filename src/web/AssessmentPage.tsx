import { STAGES, translationLabel } from '../data/sample';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Button, Card, Pill, ProgressBar, cx } from '../ui/primitives';
import { useWeb } from './context';
import { isLittleDetail, statusLabel, statusTone, stepStates } from './rowStatus';
import { fileCounts } from './store';

export function AssessmentPage({ assessmentId }: { assessmentId: string }) {
  const { state, dispatch, go, assessment } = useWeb();
  const a = assessment(assessmentId);
  const files = state.files[assessmentId] ?? [];
  const c = fileCounts(files);
  const report = state.reports[assessmentId];
  const reportReady = report && !report.loading;
  const reportStale = reportReady && c.done > report.fileIds.length;

  const reportAction = () => {
    if (reportReady && !reportStale) go({ name: 'report', assessmentId });
    else dispatch({ type: 'startReport', assessmentId });
  };
  const reportLabel = reportReady && !reportStale ? 'View summary report' : reportStale ? 'Update summary report' : 'Generate summary report';

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pb-12 pt-8 sm:px-8">
      <div className="flex flex-col gap-5">
        <Breadcrumbs items={[{ label: 'Assessments', onClick: () => go({ name: 'assessments' }) }, { label: a.name }]} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[28px] font-semibold leading-snug text-balance">{a.name}</h1>
            <span className="text-sm text-muted">{a.country} · {a.program} · {a.language} · {a.dates}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => go({ name: 'upload', assessmentId })}>Upload audio</Button>
            <Button variant="primary" disabled={c.done === 0} onClick={reportAction}>{reportLabel}</Button>
          </div>
        </div>
      </div>

      {c.total > 0 && (
        <Card aria-label="Pipeline" className="mt-[5px] flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold">Pipeline · {c.done} of {c.total} files processed</h2>
            <span className="text-[13px] text-muted">
              {c.processing ? `${c.processing} processing · checking for updates every 5 seconds` : 'All files processed'}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {STAGES.map((s) => {
              // A file has passed a step once it's finished or has moved beyond it.
              const passed = files.filter((f) => f.status === 'done' || f.stage > s.stage).length;
              const active = files.filter((f) => f.status === 'run' && f.stage === s.stage).length;
              return (
                <StepCard
                  key={s.stage}
                  n={String(s.stage)}
                  name={s.name}
                  tool={STEP_TOOLS[s.stage](translationLabel(a))}
                  value={passed / c.total}
                  count={`${passed} / ${c.total}`}
                  note={active ? `${active} in progress` : undefined}
                />
              );
            })}
            <StepCard
              n="5"
              name="Detect patterns"
              tool="Across files · summary report"
              value={reportReady && !reportStale ? 1 : 0}
              count={
                report?.loading
                  ? 'Running…'
                  : reportReady && !reportStale
                    ? 'Done · report ready'
                    : reportStale
                      ? `${c.done - report.fileIds.length} new file${c.done - report.fileIds.length > 1 ? 's' : ''} since report`
                      : 'Runs with summary report'
              }
            />
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-[#e5e9e6] px-5 py-4">
          <h2 className="text-base font-semibold">Audio files</h2>
        </div>
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted">No recordings yet. Upload audio files to start transcribing, translating and anonymizing them.</p>
            <Button variant="primary" onClick={() => go({ name: 'upload', assessmentId })}>Upload audio</Button>
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.04em] text-muted">
                  <th className="px-5 py-2.5 font-semibold">File</th>
                  <th className="px-3 py-2.5 font-semibold">Format</th>
                  <th className="px-3 py-2.5 font-semibold">Length</th>
                  <th className="px-3 py-2.5 font-semibold">Site</th>
                  <th className="px-3 py-2.5 font-semibold">Uploaded</th>
                  <th className="px-3 py-2.5 font-semibold">
                    <span className="sr-only">Pipeline steps: </span>
                    {STAGES.map((s) => s.name).join(' · ')}
                  </th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-t border-[#eef1ee] hover:bg-subtle">
                    <td className="px-5 py-2">
                      <button
                        type="button"
                        onClick={() => go({ name: 'file', assessmentId, fileId: f.id, tab: 'report' })}
                        className="cursor-pointer py-2 font-mono font-medium text-brand underline focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        {f.id}
                      </button>
                    </td>
                    <td className="px-3 py-3">{f.format}</td>
                    <td className="px-3 py-3 font-mono">{f.length}</td>
                    <td className="px-3 py-3 text-muted">{f.site}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted">{f.uploaded}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1" role="img" aria-label={statusLabel(f)}>
                        {stepStates(f).map((s) => (
                          <span
                            key={s.stage}
                            title={s.name}
                            className={cx(
                              'block h-1.5 w-7 rounded-full transition-colors duration-500',
                              s.state === 'done' ? 'bg-brand' : s.state === 'active' ? 'bg-[#9fb6ae]' : 'bg-track',
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {f.status === 'done' ? (
                        <button
                          type="button"
                          onClick={() => go({ name: 'file', assessmentId, fileId: f.id, tab: 'report' })}
                          className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-brand"
                          aria-label={`View report for ${f.id}${isLittleDetail(f) ? ', little detail' : ''}`}
                        >
                          <Pill tone={isLittleDetail(f) ? 'warn' : 'brand'} className="hover:brightness-95">
                            {isLittleDetail(f) ? 'Little detail · view' : 'View report'}
                          </Pill>
                        </button>
                      ) : (
                        <Pill tone={statusTone(f)}>{statusLabel(f)}…</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-[13px] text-muted">Transcription: Amazon Transcribe, Whisper as fallback · Translation: {translationLabel(a)} · Anonymization before any report is written.</p>
    </main>
  );
}

/** What each pipeline step runs, shown under its name. */
const STEP_TOOLS: Record<number, (translation: string) => string> = {
  1: () => 'Amazon Transcribe · Whisper fallback',
  2: (translation) => translation,
  3: () => 'Comprehend · rules · Claude checks',
  4: () => 'One report per file',
};

function StepCard({ n, name, tool, value, count, note }: { n: string; name: string; tool: string; value: number; count: string; note?: string }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-[#e5e9e6] bg-subtle p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">{n}</span>
        <span className="text-sm font-semibold">{name}</span>
      </div>
      <span className="text-xs text-muted">{tool}</span>
      <ProgressBar value={value} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[13px] tabular-nums">{count}</span>
        {note && <span className="text-xs text-info">{note}</span>}
      </div>
    </div>
  );
}
