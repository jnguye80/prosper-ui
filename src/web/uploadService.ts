/**
 * Audio upload: validation rules, the metadata sent with each recording, and the uploaders.
 *
 * The prototype uses `simulatedUpload`. For the real system, swap in `uploadWithPresignedUrl`
 * (see the flow described above it). The UploadPage only depends on the `Uploader` type.
 */

// ---------- Rules ----------

export const ACCEPTED_EXTENSIONS = ['wav', 'mp3', 'm4a', 'aac', 'ogg', 'amr'] as const;
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',') + ',audio/*';

/** Largest file accepted. A 1.5-hour group discussion as 44.1 kHz stereo WAV is ~950 MB. */
export const MAX_BYTES = 1024 * 1024 * 1024; // 1 GB
/** Recordings shorter than this are flagged: they rarely contain enough to analyse. */
export const SHORT_SECONDS = 60;
/** Recordings longer than this are flagged for a check (focus groups run up to ~1.5 h). */
export const LONG_SECONDS = 2 * 60 * 60;
/** How many files upload at the same time. */
export const PARALLEL_UPLOADS = 3;

export function extensionOf(name: string) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

/** Returns a blocking error, or null if the file can be uploaded. */
export function validateFile(name: string, size: number): string | null {
  const ext = extensionOf(name);
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `Not an audio file we accept (.${ext || '?'}). Use ${ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')}.`;
  }
  if (size === 0) return 'This file is empty.';
  if (size > MAX_BYTES) return `Larger than ${formatBytes(MAX_BYTES)}. Split the recording or export it at a lower bitrate.`;
  return null;
}

/** Non-blocking notes shown next to a file. */
export function fileWarnings(durationSec: number | null, alreadyUploaded: boolean): string[] {
  const w: string[] = [];
  if (alreadyUploaded) w.push('A file with this name is already in this assessment.');
  if (durationSec !== null && durationSec < SHORT_SECONDS) w.push('Under a minute long — may not contain enough to analyse.');
  if (durationSec !== null && durationSec > LONG_SECONDS) w.push('Over 2 hours — check this is one conversation.');
  return w;
}

// ---------- Metadata ----------

/** Written next to each recording (e.g. recordings/{assessmentId}/{uploadId}.json) and read by the pipeline. */
export interface RecordingMetadata {
  assessmentId: string;
  country: string;
  language: string;
  program: string;
  site: string;
  format: 'one-on-one' | 'group';
  participants: number;
  visit: 'first' | 'follow-up';
  consentConfirmed: boolean;
  originalFilename: string;
  sizeBytes: number;
  durationSeconds: number | null;
  uploadedAt: string;
}

// ---------- Uploaders ----------

export interface UploadHandle {
  promise: Promise<void>;
  cancel: () => void;
}

export class UploadCancelled extends Error {
  constructor() {
    super('Upload cancelled');
  }
}

export type Uploader = (
  file: File | null,
  meta: RecordingMetadata,
  onProgress: (fraction: number) => void,
  options?: { failAt?: number },
) => UploadHandle;

/**
 * Prototype uploader: fakes network progress based on file size. Nothing leaves the browser.
 * `options.failAt` (0–1) makes the upload fail part-way, to demonstrate retry.
 */
export const simulatedUpload: Uploader = (_file, meta, onProgress, options) => {
  const BYTES_PER_MS = 12_000; // ~12 MB/s
  const total = Math.min(8000, Math.max(1200, meta.sizeBytes / BYTES_PER_MS));
  const start = performance.now();
  let timer = 0;
  let cancelled = false;

  const promise = new Promise<void>((resolve, reject) => {
    timer = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(timer);
        reject(new UploadCancelled());
        return;
      }
      const p = Math.min(1, (performance.now() - start) / total);
      if (options?.failAt !== undefined && p >= options.failAt) {
        window.clearInterval(timer);
        reject(new Error('Connection lost. Check the network and retry.'));
        return;
      }
      onProgress(p);
      if (p >= 1) {
        window.clearInterval(timer);
        resolve();
      }
    }, 150);
  });

  return { promise, cancel: () => { cancelled = true; } };
};

/**
 * Production uploader (not used by the prototype).
 *
 * Flow:
 *  1. POST /assessments/{assessmentId}/uploads with the metadata
 *     → API stores the metadata JSON and returns { uploadUrl } — a presigned S3 PUT URL
 *       for recordings/{assessmentId}/{uploadId}.{ext}.
 *  2. PUT the file to uploadUrl. XHR is used because fetch() can't report upload progress.
 *  3. The S3 ObjectCreated event starts the Step Functions pipeline for that recording.
 *     The front end then polls GET /assessments/{assessmentId}/files for each file's stage.
 *
 * For files over ~100 MB, switch step 2 to S3 multipart upload (presigned URL per part)
 * so a dropped connection only retries one part.
 */
export function createPresignedUploader(apiBase: string, getToken: () => Promise<string>): Uploader {
  return (file, meta, onProgress) => {
    const xhr = new XMLHttpRequest();
    let cancelled = false;

    const promise = (async () => {
      if (!file) throw new Error('No file to upload');
      const res = await fetch(`${apiBase}/assessments/${encodeURIComponent(meta.assessmentId)}/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify(meta),
      });
      if (!res.ok) throw new Error(`Couldn’t start the upload (${res.status}).`);
      const { uploadUrl } = (await res.json()) as { uploadUrl: string };
      if (cancelled) throw new UploadCancelled();

      await new Promise<void>((resolve, reject) => {
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}).`)));
        xhr.onerror = () => reject(new Error('Connection lost. Check the network and retry.'));
        xhr.onabort = () => reject(new UploadCancelled());
        xhr.send(file);
      });
    })();

    return { promise, cancel: () => { cancelled = true; xhr.abort(); } };
  };
}

// ---------- Formatting ----------

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(sec: number | null) {
  if (sec === null || !isFinite(sec)) return '—';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** Reads a local audio file's length in the browser. Resolves null if the browser can't decode it (e.g. AMR). */
export function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    const done = (v: number | null) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    window.setTimeout(() => done(null), 5000);
    audio.src = url;
  });
}
