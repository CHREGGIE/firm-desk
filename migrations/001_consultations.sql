create table if not exists consultations (
  id text primary key,
  reference text not null unique,
  name text not null,
  email text not null,
  phone text not null default '',
  practice text not null default '',
  summary text not null,
  timing text not null default '',
  contact text not null default '',
  source text not null default 'chat',
  created_at timestamptz not null default now()
);
