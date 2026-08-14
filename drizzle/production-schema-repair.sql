-- Execute once in the SQL editor for the same Supabase project used by Vercel.
-- All statements are additive and preserve existing records.

create table if not exists portal_profiles (
  id text primary key,
  company_name text not null,
  contact_name text not null default '',
  contact_email text not null,
  contact_phone text not null default '',
  company_website text not null default '',
  company_province text not null default '',
  company_experience text not null default '',
  company_capacity text not null default '',
  company_products text not null default '',
  company_summary text not null default '',
  created_at text not null,
  updated_at text not null
);

alter table service_requests add column if not exists company_name text not null default '';
alter table service_requests add column if not exists contact_email text not null default '';
alter table service_requests add column if not exists contact_phone text not null default '';
alter table service_requests add column if not exists company_website text not null default '';
alter table service_requests add column if not exists company_province text not null default '';
alter table service_requests add column if not exists company_experience text not null default '';
alter table service_requests add column if not exists company_capacity text not null default '';
alter table service_requests add column if not exists company_products text not null default '';
alter table service_requests add column if not exists company_summary text not null default '';

create table if not exists legal_cases (
  case_key text primary key,
  company_name text not null default '',
  contact_email text not null default '',
  follow_up_status text not null default 'Sin estado',
  assigned_to text not null default '',
  assigned_team text not null default 'Legal',
  note text not null default '',
  priority_label text not null default '',
  next_step text not null default '',
  target_date text not null default '',
  updated_by text not null default '',
  updated_at text not null
);

create table if not exists legal_case_events (
  id text primary key,
  case_key text not null,
  event_type text not null default 'updated',
  actor_email text not null default '',
  summary text not null default '',
  note text not null default '',
  follow_up_status text not null default 'Sin estado',
  assigned_to text not null default '',
  next_step text not null default '',
  target_date text not null default '',
  created_at text not null
);

alter table legal_cases add column if not exists target_date text not null default '';
alter table legal_case_events add column if not exists target_date text not null default '';

create table if not exists legal_staff (
  email text primary key,
  full_name text not null default '',
  team text not null default 'Legal',
  role text not null default 'member',
  active text not null default 'true',
  created_at text not null,
  updated_at text not null
);

create table if not exists legal_dismissed_cases (
  case_key text primary key,
  dismissed_by text not null,
  dismissed_at text not null
);

alter table portal_opportunities add column if not exists public_visible boolean not null default true;
alter table portal_opportunities add column if not exists detail_documents_count integer not null default 0;
alter table portal_opportunities add column if not exists detail_change_summary text not null default '';
alter table portal_opportunities add column if not exists detail_change_at text not null default '';
alter table portal_opportunities add column if not exists opening_status text not null default '';
alter table portal_opportunities add column if not exists opening_summary text not null default '';
alter table portal_opportunities add column if not exists participant_count integer not null default 0;
alter table portal_opportunities add column if not exists offer_count integer not null default 0;
alter table portal_opportunities add column if not exists inadmissible_count integer not null default 0;
alter table portal_opportunities add column if not exists opening_result_updated_at text not null default '';