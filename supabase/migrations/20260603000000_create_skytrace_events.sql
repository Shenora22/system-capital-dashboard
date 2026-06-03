create table if not exists skytrace_events (
  event_id text primary key,
  mission_id text not null,
  event_type text not null,
  source text not null,
  severity text not null,
  status text not null,
  requires_approval boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  event_timestamp timestamptz not null,
  payload jsonb not null,
  system_event_preview jsonb not null,
  created_at timestamptz not null default now()
);

alter table skytrace_events enable row level security;

create index if not exists skytrace_events_mission_time_idx
  on skytrace_events (mission_id, event_timestamp desc);
