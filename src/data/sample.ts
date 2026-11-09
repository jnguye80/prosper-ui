// All content here is SYNTHETIC sample data for the prototype.
// No real participant data. Bracketed values like [Site A] are placeholders.

// ---------- Assessments & files ----------

/**
 * An assessment groups the audio files collected for one needs assessment:
 * one place, one program, one date range. It gets one summary report.
 */
export interface Assessment {
  id: string;
  name: string;
  country: string;
  location: string;
  program: string;
  language: string;
  dates: string;
}

export type FileStatus = 'run' | 'done';

/** Pipeline stage the file is in: 1 Transcribe, 2 Translate, 3 Anonymize, 4 Extract & report, 5 finished. */
export type Stage = 1 | 2 | 3 | 4 | 5;

export interface AudioFile {
  id: string;
  format: string;
  length: string;
  site: string;
  uploaded: string;
  visit: 'First conversation' | 'Follow-up';
  stage: Stage;
  status: FileStatus;
  /** Original filename, for files uploaded through the app. */
  sourceName?: string;
}

export const STAGES = [
  { stage: 1, name: 'Transcribe', active: 'Transcribing' },
  { stage: 2, name: 'Translate', active: 'Translating' },
  { stage: 3, name: 'Anonymize', active: 'Anonymizing' },
  { stage: 4, name: 'Report', active: 'Writing report' },
] as const;

/** Languages the pipeline handles. Non-English recordings are translated to English before anonymization. */
export const LANGUAGES = ['Arabic', 'French', 'Spanish', 'Swahili', 'English'] as const;

/** Countries offered when creating an assessment, with the language pre-selected for each. */
export const COUNTRIES: { name: string; language: (typeof LANGUAGES)[number] }[] = [
  { name: 'Sudan', language: 'Arabic' },
  { name: 'DRC', language: 'French' },
  { name: 'Colombia', language: 'Spanish' },
  { name: 'Kenya', language: 'Swahili' },
  { name: 'Pakistan', language: 'English' },
];

export const ASSESSMENTS: Assessment[] = [
  { id: 'ke-a', name: 'WASH & health baseline — [County]', country: 'Kenya', location: '[County]', program: 'WASH & health', language: 'Swahili', dates: '6–30 Oct 2026' },
  { id: 'co-a', name: 'Food security & livelihoods — [Department]', country: 'Colombia', location: '[Department]', program: 'Food security & livelihoods', language: 'Spanish', dates: '29 Sep – 17 Oct 2026' },
  { id: 'sd-a', name: 'Livelihoods & WASH baseline — [Region A]', country: 'Sudan', location: '[Region A]', program: 'Livelihoods & WASH', language: 'Arabic', dates: '1–24 Oct 2026' },
  { id: 'sd-b', name: 'Livelihoods & WASH baseline — [Region B]', country: 'Sudan', location: '[Region B]', program: 'Livelihoods & WASH', language: 'Arabic', dates: '2–20 Oct 2026' },
  { id: 'cd-a', name: 'Multi-sector follow-up — [Province]', country: 'DRC', location: '[Province]', program: 'Multi-sector', language: 'French', dates: '8–26 Sep 2026' },
];

const file = (id: string, format: string, length: string, site: string, uploaded: string, stage: Stage = 5, visit: AudioFile['visit'] = 'First conversation'): AudioFile => ({
  id, format, length, site, uploaded, visit, stage, status: stage === 5 ? 'done' : 'run',
});

export const INITIAL_FILES: Record<string, AudioFile[]> = {
  'sd-a': [
    file('C-0412', 'Group · 6', '52:14', '[Site A]', 'Oct 24, 10:42'),
    file('C-0411', 'One-on-one', '18:37', '[Site A]', 'Oct 24, 09:15', 3),
    file('C-0409', 'One-on-one', '23:02', '[Site B]', 'Oct 23, 16:20'),
    file('C-0405', 'Group · 8', '1:24:50', '[Site B]', 'Oct 23, 11:05', 2),
    file('C-0403', 'One-on-one', '14:11', '[Site C]', 'Oct 22, 14:48'),
    file('C-0401', 'One-on-one', '31:45', '[Site C]', 'Oct 22, 10:30'),
    file('C-0397', 'Group · 5', '47:20', '[Site A]', 'Oct 21, 15:12'),
    file('C-0396', 'One-on-one', '4:12', '[Site B]', 'Oct 21, 09:40'),
    file('C-0392', 'One-on-one', '3:05', '[Site C]', 'Oct 20, 13:02', 5, 'Follow-up'),
    file('C-0388', 'Group · 7', '58:31', '[Site A]', 'Oct 19, 10:18'),
  ],
  'sd-b': [
    file('C-0372', 'One-on-one', '21:16', '[Site D]', 'Oct 20, 15:30'),
    file('C-0371', 'Group · 6', '49:02', '[Site D]', 'Oct 20, 11:10'),
    file('C-0366', 'One-on-one', '17:44', '[Site E]', 'Oct 18, 14:05'),
    file('C-0361', 'One-on-one', '5:40', '[Site E]', 'Oct 16, 09:52'),
    file('C-0355', 'Group · 5', '41:27', '[Site D]', 'Oct 12, 13:20'),
    file('C-0350', 'One-on-one', '12:58', '[Site E]', 'Oct 4, 10:01'),
  ],
  'ke-a': [
    file('C-0345', 'Group · 6', '48:12', '[Site K]', 'Oct 30, 15:20', 2),
    file('C-0344', 'One-on-one', '20:41', '[Site K]', 'Oct 30, 11:02'),
    file('C-0342', 'One-on-one', '26:05', '[Site L]', 'Oct 28, 14:37'),
    file('C-0341', 'Group · 7', '1:05:48', '[Site L]', 'Oct 27, 10:15'),
    file('C-0340', 'One-on-one', '15:30', '[Site K]', 'Oct 25, 09:44'),
  ],
  'co-a': [
    file('C-0334', 'One-on-one', '24:18', '[Site M]', 'Oct 17, 16:05'),
    file('C-0333', 'Group · 5', '44:51', '[Site M]', 'Oct 15, 10:40'),
    file('C-0331', 'One-on-one', '2:58', '[Site N]', 'Oct 8, 13:22'),
    file('C-0330', 'One-on-one', '21:57', '[Site N]', 'Oct 2, 11:10'),
  ],
  'cd-a': [
    file('C-0301', 'Group · 6', '55:40', '[Site F]', 'Sep 26, 14:30', 5, 'Follow-up'),
    file('C-0297', 'One-on-one', '22:15', '[Site F]', 'Sep 22, 10:12', 5, 'Follow-up'),
    file('C-0290', 'One-on-one', '19:33', '[Site G]', 'Sep 15, 11:45', 5, 'Follow-up'),
    file('C-0284', 'Group · 8', '1:02:10', '[Site G]', 'Sep 9, 15:00', 5, 'Follow-up'),
  ],
};

/** Assessments whose summary report already exists when the prototype opens. */
export const INITIAL_REPORTS = ['cd-a'];

// ---------- Per-file report & transcript ----------

export type Segment = { kind: 'text'; text: string } | { kind: 'token'; text: string };

export interface Turn {
  speaker: string;
  time: string;
  segments: Segment[];
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface Need {
  sector: string;
  priority: Priority;
  note: string;
  /** Anonymized quote supporting this need. */
  quote?: string;
}

/** The four anonymization layers, in the order they run. */
export interface Redactions {
  /** Amazon Comprehend PII detection: names, phone numbers, addresses. */
  pii: number;
  /** Amazon Comprehend entities: names and places PII missed, often because translation changed them. */
  entities: number;
  /** Pattern rules (regex): a cheap backup for phone numbers and email addresses. */
  patterns: number;
  /** Claude context check: descriptions that could identify someone, e.g. "a widow", "a man with a broken leg". */
  context: number;
}

export interface FileDetail {
  summary: string;
  /** Where the conversation says it took place, as extracted. null = not mentioned. */
  location: string | null;
  /** Identifiers removed by each anonymization layer. */
  redacted: Redactions;
  turns: Turn[];
  needs: Need[];
}

const t = (text: string): Segment => ({ kind: 'text', text });
const k = (text: string): Segment => ({ kind: 'token', text });

const DETAILS: Record<string, FileDetail> = {
  'C-0412': {
    summary:
      'Six participants describe a broken borehole that forces women to walk about two hours for water before dawn, which they say is unsafe. Cash assistance is valued but agent fees reduce it, and the local clinic has no fever medicine for children.',
    location: 'A village near a river',
    redacted: { pii: 7, entities: 4, patterns: 1, context: 2 },
    turns: [
      { speaker: 'Facilitator', time: '00:41', segments: [t('Thank you all for coming. Can you tell me what has changed for your families since the rains stopped?')] },
      { speaker: 'Speaker 1', time: '01:05', segments: [t('I am '), k('[PERSON_1]'), t(', I live near '), k('[LOCATION_1]'), t('. The borehole there broke in August. Now the women walk almost two hours to the river and back, and we go before sunrise.')] },
      { speaker: 'Speaker 2', time: '02:31', segments: [t('Going in the dark is not safe. My neighbour’s daughter, '), k('[PERSON_8]'), t(', was followed last month. We would rather go together but it takes the whole morning.')] },
      { speaker: 'Speaker 3', time: '04:12', segments: [t('The cash from the programme helps, but the agent takes a big part. If you want to call me, my number is '), k('[PHONE_1]'), t(' — I can explain how much they take.')] },
      { speaker: 'Speaker 1', time: '05:48', segments: [t('The clinic in '), k('[LOCATION_2]'), t(' has no medicine for the children with fever. My cousin '), k('[PERSON_9]'), t(' took her son there twice.')] },
    ],
    needs: [
      { sector: 'Water & sanitation', priority: 'High', note: 'Broken borehole; about a 2-hour round trip to water.', quote: 'The borehole broke in August. Now the women walk almost two hours to the river and back.' },
      { sector: 'Protection', priority: 'High', note: 'Women at risk collecting water before dawn.', quote: 'Going in the dark is not safe. We would rather go together but it takes the whole morning.' },
      { sector: 'Health', priority: 'Medium', note: 'Clinic out of fever medicine for children.', quote: 'The clinic has no medicine for the children with fever.' },
      { sector: 'Livelihoods & cash', priority: 'Low', note: 'Cash assistance valued; agent fees reduce it.', quote: 'The cash from the programme helps, but the agent takes a big part.' },
    ],
  },
  'C-0397': {
    summary:
      'Five participants focus on health: the clinic has run out of medicine and the mobile team visits monthly at most, which leaves people with chronic conditions without treatment. The local school has closed since teachers left. Water is not a concern at this site.',
    location: null,
    redacted: { pii: 5, entities: 3, patterns: 0, context: 2 },
    turns: [
      { speaker: 'Facilitator', time: '00:30', segments: [t('What worries you most about health for your families right now?')] },
      { speaker: 'Speaker 1', time: '01:12', segments: [t('Since the clinic in '), k('[LOCATION_1]'), t(' ran out of medicine, people wait for the mobile team. It comes once a month, sometimes less.')] },
      { speaker: 'Speaker 2', time: '02:40', segments: [t('There is '), k('[PERSON_DESCRIPTION_1]'), t('. Without his tablets he had three seizures this month.')] },
      { speaker: 'Speaker 3', time: '03:55', segments: [t('My sister '), k('[PERSON_1]'), t(' walked to '), k('[LOCATION_2]'), t(' to find medicine for her husband.')] },
      { speaker: 'Speaker 1', time: '05:20', segments: [t('For water we are lucky, the pump works. But the school is closed since the teachers left.')] },
    ],
    needs: [
      { sector: 'Health', priority: 'High', note: 'Chronic medicine stock-outs; monthly mobile clinic not enough.', quote: 'People wait for the mobile team. It comes once a month, sometimes less.' },
      { sector: 'Education', priority: 'Medium', note: 'School closed since teachers left.', quote: 'The school is closed since the teachers left.' },
      { sector: 'Water & sanitation', priority: 'Low', note: 'Hand pump working at this site.' },
    ],
  },
};

/** Short recordings with little detail, like much of the test data: no needs can be identified. */
const THIN: FileDetail = {
  summary: 'A short conversation. The participant says prices at the market have gone up but doesn’t describe who is affected, where, or what is needed.',
  location: null,
  redacted: { pii: 0, entities: 0, patterns: 0, context: 0 },
  turns: [
    { speaker: 'Facilitator', time: '00:10', segments: [t('What are the biggest challenges for your family right now?')] },
    { speaker: 'Participant', time: '00:22', segments: [t('Everything costs more at the market. It is hard.')] },
    { speaker: 'Facilitator', time: '00:41', segments: [t('Can you tell me more about that?')] },
    { speaker: 'Participant', time: '00:48', segments: [t('It is the same for everyone here.')] },
  ],
  needs: [],
};
const THIN_FILES = ['C-0396', 'C-0392', 'C-0361', 'C-0331'];

/** Three generic transcripts reused for files without a hand-written one. */
const VARIANTS: FileDetail[] = [
  {
    summary:
      'The participant lost their income when their shop closed and says mobile money agents keep part of each cash transfer. The household has cut to two meals a day; the children are still in school but may drop out.',
    location: 'A market town',
    redacted: { pii: 2, entities: 2, patterns: 0, context: 0 },
    turns: [
      { speaker: 'Facilitator', time: '00:20', segments: [t('What has been hardest for your household in the last month?')] },
      { speaker: 'Participant', time: '00:48', segments: [t('The money. The transfer comes, but the agent keeps a part of it. I am '), k('[PERSON_1]'), t(', and my shop near '), k('[LOCATION_1]'), t(' closed in the summer.')] },
      { speaker: 'Participant', time: '02:15', segments: [t('We eat twice a day now. The children still go to school, but I don’t know for how long.')] },
      { speaker: 'Facilitator', time: '03:02', segments: [t('Where does your family get water?')] },
      { speaker: 'Participant', time: '03:10', segments: [t('From the tank near '), k('[LOCATION_2]'), t('. It is far, but it is clean.')] },
    ],
    needs: [
      { sector: 'Livelihoods & cash', priority: 'High', note: 'Lost income; transfer fees reduce cash assistance.', quote: 'The transfer comes, but the agent keeps a part of it.' },
      { sector: 'Food security', priority: 'Medium', note: 'Household down to two meals a day.', quote: 'We eat twice a day now.' },
      { sector: 'Education', priority: 'Low', note: 'Children in school but at risk of dropping out.', quote: 'The children still go to school, but I don’t know for how long.' },
    ],
  },
  {
    summary:
      'Families share a single hand pump and queue for up to two hours. The nearest health post has run out of fever medicine, so a sick child had to be taken to town.',
    location: 'A settlement around a shared hand pump',
    redacted: { pii: 2, entities: 1, patterns: 0, context: 0 },
    turns: [
      { speaker: 'Facilitator', time: '00:15', segments: [t('How do people here get water and health care?')] },
      { speaker: 'Participant', time: '00:40', segments: [t('We share one hand pump with the families from '), k('[LOCATION_1]'), t('. About 40 families use it, and the queue takes two hours some mornings.')] },
      { speaker: 'Participant', time: '01:55', segments: [t('My son had fever last week. The health post in '), k('[LOCATION_2]'), t(' had no medicine, so '), k('[PERSON_1]'), t(' drove him to town.')] },
      { speaker: 'Facilitator', time: '02:40', segments: [t('Has anything helped recently?')] },
      { speaker: 'Participant', time: '02:52', segments: [t('The jerrycans from last month helped. But one pump is not enough for all of us.')] },
    ],
    needs: [
      { sector: 'Water & sanitation', priority: 'High', note: 'One shared pump; queues of up to two hours.', quote: 'We share one hand pump. The queue takes two hours some mornings.' },
      { sector: 'Health', priority: 'Medium', note: 'Health post out of fever medicine.', quote: 'My son had fever last week. The health post had no medicine.' },
    ],
  },
  {
    summary:
      'Since fighting nearby, the school has closed and families keep girls at home because they fear for them on the road. Participants ask for a safe place for children to learn.',
    location: 'A village near recent fighting',
    redacted: { pii: 2, entities: 2, patterns: 0, context: 1 },
    turns: [
      { speaker: 'Facilitator', time: '00:22', segments: [t('What has changed for children in this community?')] },
      { speaker: 'Speaker 1', time: '00:51', segments: [t('Since the fighting near '), k('[LOCATION_1]'), t(', the school is closed. The teachers left.')] },
      { speaker: 'Speaker 2', time: '01:44', segments: [t('The girls stay home. We worry about them on the road to '), k('[LOCATION_2]'), t('.')] },
      { speaker: 'Speaker 3', time: '02:30', segments: [k('[PERSON_1]'), t(' started teaching a few children under the tree, but there are no books.')] },
      { speaker: 'Speaker 1', time: '03:18', segments: [t('If there was a safe place to learn, all the families would send them.')] },
    ],
    needs: [
      { sector: 'Education', priority: 'High', note: 'School closed; no teachers or materials.', quote: 'Since the fighting, the school is closed. The teachers left.' },
      { sector: 'Protection', priority: 'Medium', note: 'Girls kept home over safety on the road.', quote: 'The girls stay home. We worry about them on the road.' },
    ],
  },
];

export function getFileDetail(f: AudioFile): FileDetail {
  if (THIN_FILES.includes(f.id)) return THIN;
  return DETAILS[f.id] ?? VARIANTS[parseInt(f.id.slice(2), 10) % VARIANTS.length];
}

export const redactionTotal = (r: Redactions) => r.pii + r.entities + r.patterns + r.context;

/** True when the pipeline couldn't identify any needs, usually because the recording is short or general. */
export const isThin = (d: FileDetail) => d.needs.length === 0;

export function translationLabel(a: Assessment) {
  return a.language === 'English' ? 'English' : `${a.language} → English`;
}
