create table if not exists visits (
  id text primary key,
  source text not null,
  opened_at timestamptz not null,
  updated_at timestamptz not null,
  messages integer not null default 0,
  phase text not null default 'idle',
  matter text not null default '',
  kind text not null default 'opened',
  note text not null default '',
  company text not null default '',
  place text not null default '',
  reference text not null default '',
  status text not null default '',
  has_email integer not null default 0,
  reached_papers integer not null default 0,
  documents integer not null default 0
);
