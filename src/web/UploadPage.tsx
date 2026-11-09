import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { AudioFile } from '../data/sample';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { AlertIcon, CheckIcon, CloseIcon, UploadIcon } from '../ui/icons';
import { Button, Card, Field, Pill, ProgressBar, Segmented, cx, inputClass } from '../ui/primitives';
import { useWeb } from './context';
import {
  ACCEPT_ATTR,
  PARALLEL_UPLOADS,
  UploadCancelled,
  fileWarnings,
  formatBytes,
  formatDuration,
  readDuration,
  simulatedUpload,
  validateFile,
  type RecordingMetadata,
  type UploadHandle,
  type Uploader,
} from './uploadService';

/** Swap for createPresignedUploader(...) when the API exists. */
const uploader: Uploader = simulatedUpload;

type Visit = AudioFile['visit'];
type ItemStatus = 'ready' | 'queued' | 'uploading' | 'uploaded' | 'failed';

interface Item {
  key: string;
  file: File | null; // null for demo sample files
  name: string;
  size: number;
  durationSec: number | null;
  readingDuration: boolean;
  error: string | null;
  format: 'one' | 'group';
  participants: number;
  site: string;
  visit: Visit;
  status: ItemStatus;
  progress: number;
  failMsg?: string;
  attempts: number;
  /** Demo only: the first attempt fails part-way so retry can be tried. */
  demoFailFirst?: boolean;
}

const SAMPLES: { name: string; size: number; durationSec: number | null; group?: number; demoFailFirst?: boolean }[] = [
  { name: 'site-d_group_0930.m4a', size: 68_400_000, durationSec: 4325, group: 7 },
  { name: 'site-d_hh_1044.m4a', size: 20_800_000, durationSec: 1300 },
  { name: 'site-d_hh_1131.m4a', size: 16_700_000, durationSec: 1042, demoFailFirst: true },
  { name: 'site-d_hh_1210.m4a', size: 610_000, durationSec: 38 },
  { name: 'site-d_field-notes.pdf', size: 240_000, durationSec: null },
];

/** Compact control for table cells (inputClass is full-width). */
const cellInput =
  'h-9 rounded-[10px] border border-line-strong bg-surface px-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-70';

const looksLikeGroup = (name: string) => /group|fgd|focus/i.test(name);

export function UploadPage({ assessmentId }: { assessmentId: string }) {
  const { state, dispatch, go, toast, assessment } = useWeb();
  const a = assessment(assessmentId);
  // Names already in the assessment when this batch started (so files from this batch don't warn about themselves).
  const namesInAssessment = () => new Set((state.files[assessmentId] ?? []).map((f) => f.sourceName ?? ''));
  const [existingNames, setExistingNames] = useState(namesInAssessment);

  const [items, setItems] = useState<Item[]>([]);
  const [site, setSite] = useState('[Site D]');
  const [visit, setVisit] = useState<Visit>('First conversation');
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handles = useRef<Record<string, UploadHandle>>({});
  const nextKey = useRef(1);

  const update = (key: string, patch: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  // Stop any uploads still running if the page is left.
  useEffect(() => () => Object.values(handles.current).forEach((h) => h.cancel()), []);

  // ---------- adding files ----------

  function newItem(name: string, size: number, file: File | null, durationSec: number | null, extra?: Partial<Item>): Item {
    const error = validateFile(name, size);
    return {
      key: `u${nextKey.current++}`,
      file, name, size, durationSec,
      readingDuration: !!file && !error,
      error,
      format: looksLikeGroup(name) ? 'group' : 'one',
      participants: 6,
      site, visit,
      status: 'ready', progress: 0, attempts: 0,
      ...extra,
    };
  }

  function addFiles(files: File[]) {
    const fresh: Item[] = [];
    let skipped = 0;
    for (const f of files) {
      if (items.some((i) => i.name === f.name && i.size === f.size) || fresh.some((i) => i.name === f.name && i.size === f.size)) {
        skipped++;
        continue;
      }
      fresh.push(newItem(f.name, f.size, f, null));
    }
    if (skipped) toast(`${skipped} file${skipped > 1 ? 's were' : ' was'} already in the list.`);
    setItems((prev) => [...prev, ...fresh]);
    fresh.filter((i) => i.readingDuration && i.file).forEach((i) => {
      readDuration(i.file!).then((d) => update(i.key, { durationSec: d, readingDuration: false }));
    });
  }

  function addSamples() {
    const fresh = SAMPLES.filter((s) => !items.some((i) => i.name === s.name)).map((s) =>
      newItem(s.name, s.size, null, s.durationSec, {
        demoFailFirst: s.demoFailFirst,
        ...(s.group ? { format: 'group' as const, participants: s.group } : {}),
      }),
    );
    setItems((prev) => [...prev, ...fresh]);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!started) addFiles([...e.dataTransfer.files]);
  }

  // ---------- uploading ----------

  function metadataFor(i: Item): RecordingMetadata {
    return {
      assessmentId,
      country: a.country,
      language: a.language,
      program: a.program,
      site: i.site,
      format: i.format === 'group' ? 'group' : 'one-on-one',
      participants: i.format === 'group' ? i.participants : 1,
      visit: i.visit === 'Follow-up' ? 'follow-up' : 'first',
      consentConfirmed: consent,
      originalFilename: i.name,
      sizeBytes: i.size,
      durationSeconds: i.durationSec === null ? null : Math.round(i.durationSec),
      uploadedAt: new Date().toISOString(),
    };
  }

  function begin(i: Item) {
    const h = uploader(i.file, metadataFor(i), (p) => update(i.key, { progress: p }), i.demoFailFirst && i.attempts === 0 ? { failAt: 0.55 } : undefined);
    handles.current[i.key] = h;
    h.promise
      .then(() => {
        update(i.key, { status: 'uploaded', progress: 1 });
        dispatch({
          type: 'addFile',
          assessmentId,
          file: {
            format: i.format === 'group' ? `Group · ${i.participants}` : 'One-on-one',
            length: formatDuration(i.durationSec),
            site: i.site,
            uploaded: 'Just now',
            visit: i.visit,
            stage: 1,
            status: 'run',
            sourceName: i.name,
          },
        });
      })
      .catch((err: unknown) => {
        const cancelled = err instanceof UploadCancelled;
        update(i.key, { status: 'failed', failMsg: cancelled ? 'Cancelled.' : (err as Error).message, attempts: i.attempts + 1 });
      })
      .finally(() => {
        delete handles.current[i.key];
      });
  }

  // Start queued files, a few at a time.
  useEffect(() => {
    const free = PARALLEL_UPLOADS - items.filter((i) => i.status === 'uploading').length;
    const next = items.filter((i) => i.status === 'queued').slice(0, Math.max(0, free));
    if (!next.length) return;
    setItems((prev) => prev.map((i) => (next.some((n) => n.key === i.key) ? { ...i, status: 'uploading', progress: 0, failMsg: undefined } : i)));
    next.forEach(begin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const uploadable = items.filter((i) => !i.error);
  const blocked = items.filter((i) => i.error);
  const warningCount = uploadable.filter((i) => fileWarnings(i.durationSec, existingNames.has(i.name)).length > 0).length;
  const totalBytes = uploadable.reduce((s, i) => s + i.size, 0);
  const uploadedCount = uploadable.filter((i) => i.status === 'uploaded').length;
  const failedCount = uploadable.filter((i) => i.status === 'failed').length;
  const inFlight = uploadable.filter((i) => i.status === 'queued' || i.status === 'uploading').length;
  const allDone = started && inFlight === 0 && failedCount === 0;
  const overall = uploadable.length ? uploadable.reduce((s, i) => s + (i.status === 'uploaded' ? 1 : i.progress) * i.size, 0) / totalBytes : 0;
  const step = !items.length ? 1 : !started ? 2 : 3;

  function start() {
    if (!consent) return;
    setStarted(true);
    setItems((prev) => prev.map((i) => (i.error ? i : { ...i, status: 'queued' })));
  }

  function reset() {
    setExistingNames(namesInAssessment());
    setItems([]);
    setStarted(false);
    setConsent(false);
  }

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-4 pb-12 pt-8 sm:px-8">
      <div className="flex flex-col gap-5">
        <Breadcrumbs
          items={[
            { label: 'Assessments', onClick: () => go({ name: 'assessments' }) },
            { label: a.name, onClick: () => go({ name: 'assessment', assessmentId }) },
            { label: 'Upload audio' },
          ]}
        />
        <div className="flex flex-col gap-2.5">
          <h1 className="text-[28px] font-semibold leading-snug">Upload audio</h1>
          <span className="text-sm text-muted">
            Adding to <span className="font-semibold text-ink">{a.name}</span> · {a.country} · {a.language}
          </span>
        </div>
      </div>

      <ol aria-label="Upload steps" className="mt-[5px] flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {['Choose files', 'Check details', 'Upload'].map((label, idx) => {
          const n = idx + 1;
          const state = n < step || allDone ? 'done' : n === step ? 'current' : 'todo';
          return (
            <li key={label} aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-2">
              <span
                className={cx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                  state === 'done' ? 'bg-brand text-white' : state === 'current' ? 'border-2 border-brand text-brand' : 'bg-track text-muted',
                )}
              >
                {state === 'done' ? <CheckIcon size={12} /> : n}
              </span>
              <span className={cx(state === 'todo' ? 'text-muted' : 'font-semibold')}>{label}</span>
            </li>
          );
        })}
      </ol>

      {!started && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cx(
            'relative flex flex-col items-center gap-5 rounded-[14px] border-2 border-dashed px-6 py-12 text-center transition-colors',
            dragOver ? 'border-brand bg-brand-soft' : 'border-line-strong bg-surface',
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand"><UploadIcon size={20} /></div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-semibold">Drag audio files here</span>
            <span className="text-[13px] text-muted">WAV, MP3, M4A, AAC, OGG or AMR · up to 1 GB each · one conversation per file</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button variant="primary" onClick={() => inputRef.current?.click()}>Browse files</Button>
            <Button onClick={addSamples}>Add sample files (demo)</Button>
          </div>
          <input
            ref={inputRef}
            id="upload-input"
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose audio files"
            onChange={(e) => {
              addFiles([...(e.target.files ?? [])]);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {items.length > 0 && !started && (
        <Card className="flex flex-wrap items-end gap-4 p-4">
          <div className="min-w-[200px] flex-1">
            <Field label="Site (for all files)">
              <input id="upload-site" type="text" value={site} onChange={(e) => setSite(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div className="min-w-[260px] flex-1">
            <Segmented label="Visit (for all files)" value={visit} onChange={setVisit}
              options={[{ value: 'First conversation', label: 'First conversation' }, { value: 'Follow-up', label: 'Follow-up' }]} />
          </div>
          <Button onClick={() => setItems((prev) => prev.map((i) => ({ ...i, site, visit })))}>Apply to all files</Button>
        </Card>
      )}

      {items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e5e9e6] px-5 py-4">
            <h2 className="text-base font-semibold">Files ({items.length})</h2>
            <span className="text-[13px] text-muted">
              {uploadable.length} ready · {formatBytes(totalBytes)}
              {warningCount > 0 && ` · ${warningCount} to check`}
              {blocked.length > 0 && ` · ${blocked.length} can’t be uploaded`}
            </span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.04em] text-muted">
                  <th className="px-5 py-2.5 font-semibold">File</th>
                  <th className="px-3 py-2.5 font-semibold">Size</th>
                  <th className="px-3 py-2.5 font-semibold">Length</th>
                  <th className="px-3 py-2.5 font-semibold">Format</th>
                  <th className="px-3 py-2.5 font-semibold">Site</th>
                  <th className="px-3 py-2.5 font-semibold">Visit</th>
                  <th className="w-[210px] px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const warnings = i.error ? [] : fileWarnings(i.durationSec, existingNames.has(i.name));
                  const locked = started || !!i.error;
                  return (
                    <tr key={i.key} className="border-t border-[#eef1ee] align-top">
                      <td className="min-w-[220px] max-w-[300px] px-5 py-3">
                        <div className="break-all font-mono text-[13px] font-medium">{i.name}</div>
                        {i.error && (
                          <div className="mt-1 flex gap-1.5 text-[13px] text-high"><AlertIcon size={14} className="mt-0.5 flex-none" />{i.error}</div>
                        )}
                        {warnings.map((w) => (
                          <div key={w} className="mt-1 flex gap-1.5 text-[13px] text-warn"><AlertIcon size={14} className="mt-0.5 flex-none" />{w}</div>
                        ))}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{formatBytes(i.size)}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono">{i.readingDuration ? '…' : formatDuration(i.durationSec)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <select
                            aria-label={`Format for ${i.name}`}
                            disabled={locked}
                            value={i.format}
                            onChange={(e) => update(i.key, { format: e.target.value as Item['format'] })}
                            className={cx(cellInput, 'w-[140px]')}
                          >
                            <option value="one">One-on-one</option>
                            <option value="group">Group</option>
                          </select>
                          {i.format === 'group' && (
                            <input
                              aria-label={`Participants in ${i.name}`}
                              title="Participants"
                              type="number"
                              min={2}
                              max={30}
                              disabled={locked}
                              value={i.participants}
                              onChange={(e) => update(i.key, { participants: Math.max(2, Number(e.target.value) || 2) })}
                              className={cx(cellInput, 'w-14 px-2')}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`Site for ${i.name}`}
                          type="text"
                          disabled={locked}
                          value={i.site}
                          onChange={(e) => update(i.key, { site: e.target.value })}
                          className={cx(cellInput, 'w-[110px]')}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`Visit for ${i.name}`}
                          disabled={locked}
                          value={i.visit}
                          onChange={(e) => update(i.key, { visit: e.target.value as Visit })}
                          className={cx(cellInput, 'w-[168px]')}
                        >
                          <option>First conversation</option>
                          <option>Follow-up</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <StatusCell
                          item={i}
                          onCancel={() => handles.current[i.key]?.cancel()}
                          onRetry={() => update(i.key, { status: 'queued', progress: 0 })}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {(!started || i.error) && (
                          <button
                            type="button"
                            aria-label={`Remove ${i.name}`}
                            onClick={() => setItems((prev) => prev.filter((x) => x.key !== i.key))}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
                          >
                            <CloseIcon size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <Card className="flex flex-col gap-4 p-5">
          {!started ? (
            <>
              <label htmlFor="upload-consent" className="flex cursor-pointer items-start gap-3 text-sm leading-normal">
                <input id="upload-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 flex-none accent-brand" />
                <span>I confirm verbal consent was recorded for every conversation in these files.</span>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] text-muted">
                  {blocked.length > 0 ? `${blocked.length} file${blocked.length > 1 ? 's' : ''} that can’t be uploaded will be skipped. ` : ''}
                  Files start processing as soon as each one finishes uploading.
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <Button onClick={() => go({ name: 'assessment', assessmentId })}>Cancel</Button>
                  <Button variant="primary" disabled={!consent || uploadable.length === 0} onClick={start}>
                    Upload {uploadable.length} file{uploadable.length === 1 ? '' : 's'}
                  </Button>
                </div>
              </div>
            </>
          ) : allDone ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-[15px] font-semibold text-brand-dark">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white"><CheckIcon size={14} /></span>
                {uploadedCount} file{uploadedCount === 1 ? '' : 's'} uploaded. Processing has started.
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button onClick={reset}>Upload more</Button>
                <Button variant="primary" onClick={() => go({ name: 'assessment', assessmentId })}>View assessment</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] font-semibold">
                  {uploadedCount} of {uploadable.length} uploaded{failedCount > 0 && ` · ${failedCount} need${failedCount === 1 ? 's' : ''} a retry`}
                </span>
                <span className="text-[13px] text-muted">Keep this page open until uploads finish.</span>
              </div>
              <ProgressBar value={overall} />
              {failedCount > 0 && inFlight === 0 && (
                <div className="flex flex-wrap gap-2.5">
                  <Button size="sm" onClick={() => setItems((prev) => prev.map((i) => (i.status === 'failed' ? { ...i, status: 'queued', progress: 0 } : i)))}>
                    Retry failed uploads
                  </Button>
                  <Button size="sm" onClick={() => go({ name: 'assessment', assessmentId })}>Go to assessment</Button>
                </div>
              )}
            </div>
          )}

          {uploadable[0] && !started && (
            <details className="text-[13px] text-muted">
              <summary className="cursor-pointer select-none font-medium text-ink">What gets sent with each file</summary>
              <p className="mt-2">The audio goes to secure storage, with this record alongside it. The pipeline reads it to group the file under this assessment.</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-subtle p-3 font-mono text-xs leading-relaxed text-ink">{JSON.stringify(metadataFor(uploadable[0]), null, 2)}</pre>
            </details>
          )}
        </Card>
      )}
    </main>
  );
}

function StatusCell({ item, onCancel, onRetry }: { item: Item; onCancel: () => void; onRetry: () => void }) {
  if (item.error) return <Pill tone="high">Can’t upload</Pill>;
  switch (item.status) {
    case 'ready':
      return <Pill tone="neutral">{item.readingDuration ? 'Checking…' : 'Ready'}</Pill>;
    case 'queued':
      return <Pill tone="neutral">Waiting</Pill>;
    case 'uploading':
      return (
        <div className="flex items-center gap-2">
          <ProgressBar value={item.progress} className="flex-1" />
          <span className="w-9 text-right font-mono text-xs">{Math.round(item.progress * 100)}%</span>
          <button type="button" onClick={onCancel} aria-label={`Cancel ${item.name}`} className="cursor-pointer text-xs font-medium text-muted underline hover:text-ink">
            Cancel
          </button>
        </div>
      );
    case 'uploaded':
      return <Pill tone="brand">Uploaded · processing</Pill>;
    case 'failed':
      return (
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-[13px] text-high">{item.failMsg}</span>
          <Button size="sm" onClick={onRetry}>Retry</Button>
        </div>
      );
  }
}
