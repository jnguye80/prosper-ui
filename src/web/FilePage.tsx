import { getFileDetail, isThin, redactionTotal, translationLabel, type Priority, type Redactions } from '../data/sample';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { AlertIcon, CheckIcon, LockIcon } from '../ui/icons';
import { Button, Card, Pill, cx, type Tone } from '../ui/primitives';
import { useWeb } from './context';
import { statusLabel, statusTone, stepStates } from './rowStatus';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The anonymization layers, in the order they run (see Redactions in data/sample.ts). */
const LAYERS: { key: keyof Redactions; name: string; what: string }[] = [
  { key: 'pii', name: 'Comprehend PII', what: 'Names, phone numbers, addresses' },
  { key: 'entities', name: 'Comprehend entities', what: 'Names and places changed by translation' },
  { key: 'patterns', name: 'Pattern rules', what: 'Backup check for phone numbers and emails' },
  { key: 'context', name: 'Claude context check', what: 'Descriptions that could identify someone' },
];

const PRIORITY_TONE: Record<Priority, Tone> = { High: 'high', Medium: 'warn', Low: 'neutral' };

export function FilePage({ assessmentId, fileId, tab }: { assessmentId: string; fileId: string; tab: 'report' | 'transcript' }) {
  const { state, go, toast, assessment } = useWeb();
  const a = assessment(assessmentId);
  const files = state.files[assessmentId] ?? [];
  const f = files.find((x) => x.id === fileId) ?? files[0];
  const detail = getFileDetail(f);
  const done = f.status === 'done';
  const removedTotal = redactionTotal(detail.redacted);
  const thin = isThin(detail);
  const speakers = new Set(detail.turns.map((t) => t.speaker)).size;
  /** What each step produced for this file, shown once the step is done. */
  const stepOutput: Record<number, string> = {
    1: `${f.length} of audio · ${speakers} speakers`,
    2: a.language === 'English' ? 'English, no translation needed' : `${a.language} → English`,
    3: removedTotal ? `${plural(removedTotal, 'identifier', 'identifiers')} removed` : 'No identifiers found',
    4: thin ? 'No needs identified' : `${plural(detail.needs.length, 'need', 'needs')} identified`,
  };
  const setTab = (t: 'report' | 'transcript') => go({ name: 'file', assessmentId, fileId: f.id, tab: t });

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-12 pt-8 sm:px-8">
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: 'Assessments', onClick: () => go({ name: 'assessments' }) },
            { label: a.name, onClick: () => go({ name: 'assessment', assessmentId }) },
            { label: f.id },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-[28px] font-semibold">{f.id}</h1>
            <Pill tone={statusTone(f)}>{statusLabel(f)}</Pill>
          </div>
          {done && <Button onClick={() => toast(`Downloaded ${f.id} report (prototype: no file created)`)}>Download report</Button>}
        </div>
      </div>

      {/* How this file was analyzed: each pipeline step and what it produced */}
      <Card aria-label="How this file was analyzed" className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">How this file was analyzed</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stepStates(f).map((s) => (
            <div key={s.stage} className="flex items-start gap-2.5 rounded-[10px] bg-subtle p-3">
              <span
                className={cx(
                  'flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold',
                  s.state === 'done' ? 'bg-brand text-white' : s.state === 'active' ? 'border-2 border-brand text-brand' : 'bg-track text-muted',
                )}
              >
                {s.state === 'done' ? <CheckIcon size={14} /> : s.stage}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className={cx('text-sm font-semibold', s.state === 'todo' && 'text-muted')}>{s.name}</span>
                <span className={cx('text-xs', s.state === 'done' && s.stage === 4 && thin ? 'font-medium text-warn' : 'text-muted')}>
                  {s.state === 'done' ? stepOutput[s.stage] : s.state === 'active' ? 'In progress…' : 'Waiting'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-start gap-6">
        <Card className="min-w-0 flex-[999_1_620px] overflow-hidden">
          <div role="tablist" aria-label="File view" className="flex flex-wrap gap-1 border-b border-[#e5e9e6] px-3 py-2.5">
            <TabButton selected={tab === 'report'} onClick={() => setTab('report')}>Report</TabButton>
            <TabButton selected={tab === 'transcript'} onClick={() => setTab('transcript')}>Transcript (anonymized)</TabButton>
          </div>

          {!done ? (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <h2 className="text-lg font-semibold">{statusLabel(f)}…</h2>
              <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
                The report and anonymized transcript appear here when processing finishes. Nothing is shown before identifiers are removed.
              </p>
            </div>
          ) : tab === 'report' ? (
            <div role="tabpanel" className="flex flex-col gap-7 px-6 py-6 sm:px-8">
              {thin && (
                <div role="status" className="flex items-start gap-3 rounded-xl bg-warn-soft px-4 py-3.5 text-sm leading-normal text-[#5c3405]">
                  <AlertIcon size={18} className="mt-0.5 flex-none" />
                  <span>
                    <strong>Little detail in this recording.</strong> No needs could be identified. Short or general conversations rarely say who is
                    affected, where, or what is needed. It still counts toward the assessment but adds nothing to the summary report.
                  </span>
                </div>
              )}
              <section className="flex flex-col gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Summary</h2>
                <p className="max-w-[68ch] text-base leading-[1.65]">{detail.summary}</p>
              </section>

              <section className="flex flex-col gap-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Location mentioned</h2>
                <p className={cx('text-[15px]', !detail.location && 'text-muted')}>{detail.location ?? 'Not specified in the conversation'}</p>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">Identified needs</h2>
                {thin && <p className="text-sm text-muted">None identified.</p>}
                <div className="flex flex-col">
                  {detail.needs.map((n) => (
                    <div key={n.sector} className="flex flex-col gap-1.5 border-b border-[#f0f2ef] py-3 last:border-b-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[15px] font-semibold">{n.sector}</span>
                        <Pill tone={PRIORITY_TONE[n.priority]} className="px-2 py-0.5">{n.priority}</Pill>
                      </div>
                      <span className="text-sm text-muted">{n.note}</span>
                      {n.quote && <blockquote className="font-serif text-[15px] leading-normal text-ink">“{n.quote}”</blockquote>}
                    </div>
                  ))}
                </div>
              </section>

            </div>
          ) : (
            <div role="tabpanel" className="flex flex-col px-6 pb-6 pt-2">
              <section aria-label="How identifiers were removed" className="flex flex-col gap-2.5 border-b border-[#f0f2ef] py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    {removedTotal ? `${plural(removedTotal, 'identifier', 'identifiers')} removed` : 'No identifiers found'}
                  </h2>
                  <span className="text-xs text-muted">Four checks run in order</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {LAYERS.map((l, i) => (
                    <div key={l.key} className="flex items-start gap-3 rounded-[10px] border border-[#e5e9e6] bg-subtle px-3 py-2.5">
                      <span className="w-6 flex-none font-mono text-lg font-semibold tabular-nums">{detail.redacted[l.key]}</span>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[13px] font-semibold">{i + 1}. {l.name}</span>
                        <span className="text-xs text-muted">{l.what}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted">Counts and figures, such as “40 families”, are kept so they can be analysed.</p>
              </section>
              {detail.turns.map((turn, i) => (
                <div key={i} className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 border-b border-[#f0f2ef] py-3.5 last:border-b-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold">{turn.speaker}</span>
                    <span className="font-mono text-xs text-muted">{turn.time}</span>
                  </div>
                  <p className="text-[15px] leading-[1.75]">
                    {turn.segments.map((seg, j) =>
                      seg.kind === 'text' ? (
                        <span key={j}>{seg.text}</span>
                      ) : (
                        <span key={j} className="whitespace-nowrap rounded-[5px] bg-redact px-1.5 py-0.5 font-mono text-[13px] text-white">{seg.text}</span>
                      ),
                    )}
                  </p>
                </div>
              ))}
              <p className="flex items-center gap-2 pt-4 text-[13px] text-muted">
                <LockIcon size={14} /> The original audio and untranslated transcript are restricted to data protection reviewers.
              </p>
            </div>
          )}
        </Card>

        <aside className="flex flex-[1_1_280px] flex-col gap-4">
          <Card className="flex flex-col gap-2.5 p-[18px] text-sm">
            <h2 className="text-base font-semibold">File details</h2>
            {[
              ['Format', f.format],
              ['Length', f.length],
              ['Site', f.site],
              ['Visit', f.visit],
              ['Language', translationLabel(a)],
              ['Uploaded', f.uploaded],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-muted">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </Card>
          <Button onClick={() => go({ name: 'assessment', assessmentId })}>Back to all files</Button>
        </aside>
      </div>
    </main>
  );
}

function TabButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cx(
        'flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand',
        selected ? 'bg-ink text-white' : 'text-muted hover:bg-subtle',
      )}
    >
      {children}
    </button>
  );
}
