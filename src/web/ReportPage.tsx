import { useState } from 'react';
import { getFileDetail, isThin, translationLabel, type AudioFile } from '../data/sample';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Button, Card, ProgressBar, cx } from '../ui/primitives';
import { useWeb } from './context';

interface SectorRollup {
  sector: string;
  count: number;
  high: number;
  notes: string[];
  quotes: { text: string; fileId: string }[];
}

/** Aggregates the per-file reports into one view per sector. */
function rollUp(files: AudioFile[]): SectorRollup[] {
  const map = new Map<string, SectorRollup>();
  for (const f of files) {
    for (const n of getFileDetail(f).needs) {
      const r = map.get(n.sector) ?? { sector: n.sector, count: 0, high: 0, notes: [], quotes: [] };
      r.count += 1;
      if (n.priority === 'High') r.high += 1;
      // High-priority notes first, so the key finding quotes the most urgent one.
      if (!r.notes.includes(n.note)) {
        if (n.priority === 'High') r.notes.unshift(n.note);
        else r.notes.push(n.note);
      }
      if (n.quote && !r.quotes.some((q) => q.text === n.quote)) r.quotes.push({ text: n.quote, fileId: f.id });
      map.set(n.sector, r);
    }
  }
  return [...map.values()].sort((a, b) => b.high - a.high || b.count - a.count);
}

export function ReportPage({ assessmentId }: { assessmentId: string }) {
  const { state, go, toast, assessment } = useWeb();
  const a = assessment(assessmentId);
  const report = state.reports[assessmentId];
  const allFiles = state.files[assessmentId] ?? [];
  const [picked, setPicked] = useState<string | null>(null);

  const crumbs = (
    <Breadcrumbs
      items={[
        { label: 'Assessments', onClick: () => go({ name: 'assessments' }) },
        { label: a.name, onClick: () => go({ name: 'assessment', assessmentId }) },
        { label: 'Summary report' },
      ]}
    />
  );

  if (!report || report.loading) {
    return (
      <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 pb-14 pt-8 sm:px-8">
        {crumbs}
        <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <ProgressBar indeterminate className="w-72" />
          <h1 className="text-xl font-semibold">Writing the summary report from {report?.fileIds.length ?? 0} files…</h1>
          <p className="text-sm text-muted">Combining the individual file reports and looking for patterns across them.</p>
        </Card>
      </main>
    );
  }

  const files = allFiles.filter((f) => report.fileIds.includes(f.id));
  const n = files.length;
  const sectors = rollUp(files);
  const selected = sectors.find((s) => s.sector === picked) ?? sectors[0];
  const notIncluded = allFiles.length - n;
  const thinIds = files.filter((f) => isThin(getFileDetail(f))).map((f) => f.id);

  return (
    <main className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 pb-14 pt-8 sm:px-8">
      {crumbs}

      <Card as="article" className="flex flex-col gap-8 px-5 py-9 sm:px-12">
        <header className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-dark">Summary report · Draft</span>
            <Button size="sm" variant="primary" onClick={() => toast('Exported summary report as .docx (prototype: no file created)')}>Export to Word</Button>
          </div>
          <h1 className="font-serif text-[30px] font-semibold leading-snug text-balance sm:text-[34px]">{a.name}</h1>
          <span className="text-sm text-muted">
            {a.country} · {n} audio file{n === 1 ? '' : 's'} · {translationLabel(a)} · {a.dates} · generated {report.generated}
          </span>
          {notIncluded > 0 && (
            <span className="self-start rounded-lg bg-warn-soft px-2.5 py-1.5 text-[13px] text-[#5c3405]">
              {notIncluded} file{notIncluded > 1 ? 's' : ''} uploaded after this report or still processing {notIncluded > 1 ? 'are' : 'is'} not included.
            </span>
          )}
          {thinIds.length > 0 && (
            <span className="self-start rounded-lg bg-warn-soft px-2.5 py-1.5 text-[13px] text-[#5c3405]">
              {thinIds.length} of {n} files had too little detail to identify needs ({thinIds.join(', ')}). Longer, more specific conversations would strengthen this report.
            </span>
          )}
          <p className="rounded-lg bg-subtle px-3 py-2 text-[13px] text-muted">
            Report format is a placeholder until Prosper Global shares the written report they want.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Key findings</h2>
          <ol className="flex max-w-[68ch] list-decimal flex-col gap-2.5 pl-5 text-base leading-[1.65]">
            {sectors.slice(0, 3).map((s) => (
              <li key={s.sector}>
                <strong>{s.sector}</strong> came up in {s.count} of {n} file{n === 1 ? '' : 's'}{s.high ? `, as a high priority in ${s.high}` : ''}. {s.notes[0]}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">Needs by sector</h2>
            <span className="text-[13px] text-muted">Files raising each need, of {n} · select a sector for quotes</span>
          </div>
          <div className="flex flex-col gap-1">
            {sectors.map((s) => {
              const on = s.sector === selected?.sector;
              return (
                <button
                  key={s.sector}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(s.sector)}
                  className={cx(
                    'grid cursor-pointer grid-cols-[minmax(110px,170px)_minmax(0,1fr)_32px] items-center gap-3.5 rounded-lg px-2.5 py-2 text-left focus-visible:outline-2 focus-visible:outline-brand',
                    on ? 'bg-brand-soft' : 'hover:bg-subtle',
                  )}
                >
                  <span className="text-sm font-medium">{s.sector}</span>
                  <span className="block h-3.5 overflow-hidden rounded bg-track">
                    <span className="block h-3.5 rounded bg-brand" style={{ width: `${(s.count / n) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-sm tabular-nums">{s.count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selected && (
          <section className="flex flex-col gap-3.5">
            <h2 className="text-lg font-semibold">
              In their words <span className="text-[15px] font-normal text-muted">· {selected.sector}</span>
            </h2>
            {selected.quotes.length === 0 && <p className="text-sm text-muted">No quotes recorded for this sector.</p>}
            {selected.quotes.map((q) => (
              <figure key={q.text} className="flex max-w-[68ch] flex-col gap-1.5 border-l-[3px] border-line py-1 pl-[18px]">
                <blockquote className="font-serif text-lg leading-[1.55]">“{q.text}”</blockquote>
                <figcaption className="text-[13px] text-muted">
                  From{' '}
                  <button
                    type="button"
                    onClick={() => go({ name: 'file', assessmentId, fileId: q.fileId, tab: 'report' })}
                    className="cursor-pointer font-mono text-brand underline focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {q.fileId}
                  </button>
                </figcaption>
              </figure>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-3 border-t border-[#e5e9e6] pt-6">
          <h2 className="text-[15px] font-semibold">Source files ({n})</h2>
          <p className="text-[13px] text-muted">Each file has its own report and anonymized transcript. Amber files had too little detail to identify needs.</p>
          <div className="flex flex-wrap gap-2">
            {files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => go({ name: 'file', assessmentId, fileId: f.id, tab: 'report' })}
                title={thinIds.includes(f.id) ? 'Little detail: no needs identified' : undefined}
                className={cx(
                  'h-9 cursor-pointer rounded-full border px-3 font-mono text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-brand',
                  thinIds.includes(f.id) ? 'border-warn-strong bg-warn-soft hover:brightness-95' : 'border-line-strong bg-surface hover:bg-subtle',
                )}
              >
                {f.id}
              </button>
            ))}
          </div>
        </section>
      </Card>
    </main>
  );
}
