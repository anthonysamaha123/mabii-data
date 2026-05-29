-- Mabii community survey — backend schema.
-- Privacy by design (SURVEY.md §4 / SPEC §2.8): no PII. IP/UA never stored;
-- only a salted, per-wave dedup hash and a short-lived ip-hash for velocity.
-- All tables RLS-on with NO public policies → only the service role (server
-- side) can read/write. Anonymized aggregates are published separately.

-- ── Submissions (anonymized) ─────────────────────────────────────────
create table if not exists survey_submission (
  id           uuid primary key default gen_random_uuid(),
  wave         text not null,
  respondent   text not null check (respondent in ('person','business')),
  governorate  text not null,
  anchors      jsonb not null default '{}'::jsonb,
  module_id    text not null default 'core',
  answers      jsonb not null default '{}'::jsonb,
  integrity    jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);
create index if not exists survey_submission_wave_idx
  on survey_submission (wave, respondent, governorate);

-- ── Per-wave dedup (privacy-preserving uniqueness) ───────────────────
-- key = (wave, dedup_hash). Insert succeeds once per (wave, hash); a second
-- attempt hits the unique constraint → "already submitted".
create table if not exists survey_dedup (
  wave        text not null,
  dedup_hash  text not null,
  created_at  timestamptz not null default now(),
  primary key (wave, dedup_hash)
);

-- ── IP velocity (rate limiting) ──────────────────────────────────────
-- ip_hash is a salted HMAC, not an IP. Rows pruned by the app / a cron.
create table if not exists survey_velocity (
  ip_hash  text not null,
  ts       timestamptz not null default now()
);
create index if not exists survey_velocity_idx on survey_velocity (ip_hash, ts);

-- ── Published aggregates (safe to expose read-only) ──────────────────
-- The aggregation engine writes wave aggregates here; the public site reads
-- them. Only suppressed (n>=30) cells are ever written.
create table if not exists survey_aggregate (
  wave          text not null,
  question_id   text not null,
  respondent    text not null,
  segment_type  text not null,         -- 'governorate' | 'national'
  segment       text not null,         -- e.g. 'LBN-BA' | 'LBN'
  n             integer not null,
  options       jsonb not null,        -- [{value, proportion, ci_low, ci_high}]
  generated_at  timestamptz not null default now(),
  primary key (wave, question_id, respondent, segment_type, segment)
);

-- ── RLS: lock everything; service role bypasses RLS ──────────────────
alter table survey_submission enable row level security;
alter table survey_dedup       enable row level security;
alter table survey_velocity    enable row level security;
alter table survey_aggregate   enable row level security;

-- Public (anon) may READ only the aggregates — never raw submissions.
drop policy if exists "aggregates are public read" on survey_aggregate;
create policy "aggregates are public read"
  on survey_aggregate for select
  to anon
  using (true);
