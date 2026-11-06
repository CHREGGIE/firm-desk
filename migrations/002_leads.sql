create table if not exists leads (
  id text primary key,
  reference text not null unique,
  status text not null,
  matter text not null,
  company text not null default '',
  role text not null default '',
  name text not null,
  email text not null,
  phone text not null default '',
  opponent text not null default '',
  place text not null default '',
  deadline text not null default '',
  stake text not null default '',
  summary text not null,
  doc_note text not null default '',
  source text not null default 'chat',
  draft_id text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists lead_files (
  id text primary key,
  lead_id text,
  draft_id text not null,
  filename text not null,
  content_type text not null,
  bytes bytea not null,
  created_at timestamptz not null default now()
);
