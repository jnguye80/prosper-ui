import { useState } from 'react';
import { CloseIcon } from '../ui/icons';
import { Button, Field, Modal, inputClass } from '../ui/primitives';
import { COUNTRIES, LANGUAGES } from '../data/sample';
import { useWeb } from './context';

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">{title}</h2>
      <button type="button" aria-label="Close" onClick={onClose} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg hover:bg-subtle">
        <CloseIcon />
      </button>
    </div>
  );
}

export function NewAssessmentModal() {
  const { dispatch, toast } = useWeb();
  const close = () => dispatch({ type: 'closeModal' });
  const [form, setForm] = useState({
    country: 'Sudan',
    location: '[Region C]',
    program: 'Livelihoods & WASH',
    language: 'Arabic',
    start: '2026-11-02',
    end: '2026-11-20',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });
  const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Modal label="New assessment" onClose={close} width="max-w-[560px]">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: 'newAssessment',
            assessment: {
              name: `${form.program} — ${form.location}`,
              country: form.country,
              location: form.location,
              program: form.program,
              language: form.language,
              dates: `${fmt(form.start)} – ${fmt(form.end)}`,
            },
          });
          toast('Assessment created. Upload audio files to get started.');
        }}
      >
        <ModalHeader title="New assessment" onClose={close} />
        <p className="text-sm leading-normal text-muted">Group the recordings from one place, program and date range. They’ll share one summary report.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Country">
            <select
              id="new-country"
              value={form.country}
              onChange={(e) => {
                const c = COUNTRIES.find((x) => x.name === e.target.value);
                setForm({ ...form, country: e.target.value, language: c?.language ?? form.language });
              }} className={inputClass}>
              {COUNTRIES.map((c) => <option key={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Location (region or site)">
            <input id="new-location" type="text" value={form.location} onChange={set('location')} className={inputClass} required />
          </Field>
          <Field label="Program">
            <input id="new-program" type="text" value={form.program} onChange={set('program')} className={inputClass} required />
          </Field>
          <Field label="Language spoken">
            <select id="new-language" value={form.language} onChange={set('language')} className={inputClass}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Start date">
            <input id="new-start" type="date" value={form.start} onChange={set('start')} className={inputClass} required />
          </Field>
          <Field label="End date">
            <input id="new-end" type="date" value={form.end} onChange={set('end')} className={inputClass} required />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button onClick={close}>Cancel</Button>
          <Button type="submit" variant="primary">Create assessment</Button>
        </div>
      </form>
    </Modal>
  );
}
