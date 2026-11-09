# ACoRN UI prototype

React + Tailwind prototype of the ACoRN (Conversational Needs Assessment) desktop web app, built for the Prosper Global × ASU AI CIC POC.

The flow follows the team's Nov 2026 review — keep it simple, one report per audio file, one summary report per assessment:

0. **Sign in / Create account** — work email + password, forgot password, and a header menu with the signed-in user (name, email, organization, role) and Sign out. Sign-up asks for name, work email, organization, role (Program / MEL staff, Data protection reviewer, Uploads recordings) and password.
1. **Assessments** — list of assessments. An assessment groups the recordings from one place, program and date range (e.g. "Livelihoods & WASH baseline — [Region A]").
2. **Assessment** — upload audio, watch each file move through Transcribe → Translate → Anonymize → Report, open any file's report, generate the assessment's summary report.
3. **File** — "How this file was analyzed" (what each pipeline step produced), the file's own report (summary, location mentioned, identified needs with priority and quotes) and its anonymized transcript with a count per anonymization layer (Comprehend PII → Comprehend entities → pattern rules → Claude context check). Files whose report found no needs are marked **Little detail**, the case the thin test recordings produce.
4. **Upload audio** — choose files (drag and drop, browse, or demo samples) → check details → upload. See *Upload process* below.
5. **Summary report** — rolls up all processed files in the assessment: key findings, needs by sector, quotes that link back to their source file, list of source files. It says how many files had too little detail to identify needs. Format is a placeholder until Prosper Global shares the written report they want.

All content is **synthetic sample data**. Bracketed values such as `[Site A]` and `[__]%` are placeholders. No backend is called; every action updates local state only.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run build:single # one self-contained dist-single/index.html for sharing
```

Requires Node 18+.

## Stack

- React 18 + TypeScript, Vite 6
- Tailwind CSS v4 via `@tailwindcss/vite` — design tokens (colors, fonts) live in `src/index.css` under `@theme`
- IBM Plex Sans / Mono / Serif from Google Fonts
- No UI library; small primitives in `src/ui/`

## Where things are

```
src/
  App.tsx                  entry component
  auth/AuthScreen.tsx      sign in, create account, reset password
  auth/UserMenu.tsx        header account menu with sign out
  data/sample.ts           all synthetic data: assessments, files, per-file reports and transcripts
  ui/                      Button, Pill, Card, Segmented, Modal, Toast, Breadcrumbs, icons, logo
  web/
    store.ts               reducer: screens, files per assessment, summary reports
    WebApp.tsx             header, pipeline status timer, modals
    AssessmentsPage.tsx    list of assessments
    AssessmentPage.tsx     files in one assessment and their pipeline progress
    FilePage.tsx           one file: processing steps, report, anonymized transcript
    ReportPage.tsx         summary report computed from the assessment's file reports
    UploadPage.tsx         upload flow: choose, check, upload with progress / cancel / retry
    uploadService.ts       file rules, metadata record, simulated uploader, real presigned-URL uploader
    Modals.tsx             new assessment
```

## Upload process

1. **Choose files** — drag and drop or browse. Several files at once; a file already in the list is skipped.
2. **Check details** — each file is checked in the browser before anything is sent:
   - *Blocked:* not WAV / MP3 / M4A / AAC / OGG / AMR, empty, or over 1 GB.
   - *Warnings (can still upload):* under 1 minute, over 2 hours, or a file with the same name is already in the assessment.
   - Length is read from the file itself. Format (one-on-one or group + participants), site and visit are set per file, with "Apply to all files" for the common case. Group is pre-selected when the filename contains "group", "fgd" or "focus".
   - The uploader must confirm verbal consent was recorded before the Upload button enables.
3. **Upload** — 3 files at a time, each with progress and Cancel. A failed file shows the reason and Retry; other files carry on. Each file joins the assessment and starts processing as soon as *it* finishes, not when the whole batch does.

Each file is sent with a metadata record (`RecordingMetadata` in `uploadService.ts`): assessment ID, country, language, program, site, format, participants, visit, consent, original filename, size, duration, timestamp. The page shows it under "What gets sent with each file".

**Connecting the real backend:** in `UploadPage.tsx`, replace `simulatedUpload` with `createPresignedUploader(apiBase, getToken)`. That uploader:
1. `POST /assessments/{id}/uploads` with the metadata → API saves the metadata JSON and returns a presigned S3 PUT URL.
2. `PUT` the file to that URL with XHR (for upload progress).
3. The S3 `ObjectCreated` event starts the Step Functions pipeline for that recording; the front end polls each file's stage.

For files over ~100 MB, use S3 multipart upload so a dropped connection only retries one part.

All limits (`MAX_BYTES`, `SHORT_SECONDS`, `LONG_SECONDS`, `PARALLEL_UPLOADS`, accepted formats) are constants at the top of `uploadService.ts`.

## Prototype behaviour to replace with real services

| Prototype | Real system |
| --- | --- |
| `tick` action advances processing files every 5 s (`PIPELINE_TICK_MS`) | Front end polls (or subscribes to) Step Functions execution status per file |
| `simulatedUpload` fakes progress; nothing leaves the browser | `createPresignedUploader` — presigned S3 PUT + metadata JSON per recording |
| Per-file report and transcript come from `data/sample.ts` | Redacted transcript and per-file report stored in S3 |
| Summary report is computed in the browser after 1.8 s | Aggregation + report-generation step over the assessment's files |
| Any well-formed email + 8-character password signs in; nothing is stored | Real authentication (e.g. Amazon Cognito user pool), roles enforced on the API: only Data protection reviewers can open original audio |
| New assessment form keeps the assessment in memory | Assessment record (name, country, location, program, language, dates) in a datastore |
