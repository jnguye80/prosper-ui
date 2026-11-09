import { Button, Card, Pill, ProgressBar } from '../ui/primitives';
import { useWeb } from './context';
import { fileCounts } from './store';

export function AssessmentsPage() {
  const { state, dispatch, go } = useWeb();

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-12 pt-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] font-semibold leading-tight">Assessments</h1>
          <p className="max-w-[60ch] text-sm leading-normal text-muted">
            Each assessment groups the recordings from one place, program and date range, and gets one summary report.
          </p>
        </div>
        <Button variant="primary" onClick={() => dispatch({ type: 'openModal', modal: 'new-assessment' })}>New assessment</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.04em] text-muted">
                <th className="px-5 py-3 font-semibold">Assessment</th>
                <th className="px-3 py-3 font-semibold">Country</th>
                <th className="px-3 py-3 font-semibold">Language</th>
                <th className="px-3 py-3 font-semibold">Dates</th>
                <th className="px-3 py-3 font-semibold">Audio files</th>
                <th className="px-5 py-3 font-semibold">Summary report</th>
              </tr>
            </thead>
            <tbody>
              {state.assessments.map((a) => {
                const c = fileCounts(state.files[a.id] ?? []);
                const report = state.reports[a.id];
                return (
                  <tr key={a.id} className="border-t border-[#eef1ee] hover:bg-subtle">
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => go({ name: 'assessment', assessmentId: a.id })}
                        className="cursor-pointer text-left font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                      >
                        {a.name}
                      </button>
                      <div className="mt-0.5 text-[13px] text-muted">{a.program}</div>
                    </td>
                    <td className="px-3 py-3.5">{a.country}</td>
                    <td className="px-3 py-3.5">{a.language}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{a.dates}</td>
                    <td className="px-3 py-3.5">
                      {c.total === 0 ? (
                        <span className="text-muted">No files yet</span>
                      ) : (
                        <div className="flex w-44 flex-col gap-1.5">
                          <span>{c.done} of {c.total} processed</span>
                          <ProgressBar value={c.done / c.total} />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {report && !report.loading ? (
                        <Pill tone="brand">Ready</Pill>
                      ) : c.total > 0 && c.processing === 0 ? (
                        <Pill tone="neutral">Ready to generate</Pill>
                      ) : (
                        <Pill tone="neutral">Waiting for files</Pill>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}
