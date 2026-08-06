-- Action Architecture Workbench — target PostgreSQL schema v2.0
-- Transcribed verbatim from 04_DATA_MODEL_SCHEMA_AND_RESEARCH_PROTOCOL.md's "PostgreSQL /
-- Supabase schema" section. Apply only after the local-JSON visual product has passed
-- acceptance (Phases 0–4) — see docs/PHASE5_REVIEW_REPORT.md for how this migration was
-- authored and what has and hasn't been run against a live database.
--
-- Deviation from the supplied spec (documented, not silently patched): the source JSON
-- bundle (action-architecture-data.json) contains a `cgi_relationships` table (7 records,
-- RESTRICTED classification) that has no corresponding table in the supplied schema. It is
-- intentionally NOT invented here — see docs/PHASE5_REVIEW_REPORT.md §5.

create table if not exists vendors (
  id text primary key,
  name text not null,
  category text,
  website_url text,
  logo_strategy text,
  logo_value text,
  relationship_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists systems (
  id text primary key,
  name text not null,
  vendor_id text references vendors(id),
  product_name text,
  domain_id text not null,
  parent_system_id text references systems(id),
  core_system_id text references systems(id),
  architecture_role text not null,
  business_process text,
  description text,
  deployment_status text not null,
  evidence_status text not null,
  confidence_score integer check (confidence_score between 0 and 100),
  lifecycle_disposition text,
  modernity text,
  system_of_record text,
  criticality text,
  hosting_model text,
  deployment_model text,
  geography_scope text,
  user_groups text,
  first_known_year integer,
  last_verified_date date,
  open_questions text,
  notes text,
  classification text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists capabilities (
  id text primary key,
  name text not null,
  domain_id text not null,
  description text
);

create table if not exists system_capabilities (
  system_id text not null references systems(id) on delete cascade,
  capability_id text not null references capabilities(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (system_id, capability_id)
);

create table if not exists commercial_relationships (
  id text primary key,
  vendor_id text not null references vendors(id),
  relationship_type text not null,
  scope_summary text,
  start_year integer,
  start_precision text not null default 'unknown',
  known_since_year integer,
  duration_years_as_of_date integer,
  current_status text,
  lifecycle_status text,
  strategic_role text,
  geography_scope text,
  directness text,
  implementation_partner_id text references vendors(id),
  support_partner_id text references vendors(id),
  evidence_status text,
  confidence_score integer check (confidence_score between 0 and 100),
  last_verified_date date,
  open_questions text,
  notes text,
  classification text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists commercial_relationship_systems (
  relationship_id text not null references commercial_relationships(id) on delete cascade,
  system_id text not null references systems(id) on delete cascade,
  primary key (relationship_id, system_id)
);

create table if not exists evidence_sources (
  id text primary key,
  title text not null,
  url_or_reference text,
  source_type text not null,
  publisher text,
  publication_date date,
  checked_date date,
  classification text not null default 'internal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists claims (
  id text primary key,
  subject_type text not null,
  subject_id text not null,
  predicate text not null,
  value text not null,
  status text not null,
  confidence_score integer check (confidence_score between 0 and 100),
  valid_from date,
  valid_to date,
  checked_date date,
  classification text not null default 'internal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists claim_sources (
  claim_id text not null references claims(id) on delete cascade,
  source_id text not null references evidence_sources(id) on delete cascade,
  primary key (claim_id, source_id)
);

create table if not exists system_sources (
  system_id text not null references systems(id) on delete cascade,
  source_id text not null references evidence_sources(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (system_id, source_id)
);

create table if not exists architecture_relationships (
  id text primary key,
  source_system_id text not null references systems(id),
  target_system_id text not null references systems(id),
  direction text,
  relationship_type text not null,
  integration_pattern text,
  data_objects jsonb not null default '[]'::jsonb,
  frequency text,
  status text,
  is_missing_link boolean not null default false,
  evidence_status text,
  confidence_score integer check (confidence_score between 0 and 100),
  validation_question text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists architecture_relationship_sources (
  relationship_id text not null references architecture_relationships(id) on delete cascade,
  source_id text not null references evidence_sources(id) on delete cascade,
  primary key (relationship_id, source_id)
);

create table if not exists technical_observations (
  id text primary key,
  technology_name text not null,
  vendor_name text,
  category text,
  mapped_system_id text references systems(id),
  hostname_or_scope text,
  observation_date date,
  first_seen date,
  last_seen date,
  currentness text,
  confidence_score integer check (confidence_score between 0 and 100),
  direct_contract_inference_allowed boolean not null default false,
  source_id text references evidence_sources(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gaps (
  id text primary key,
  name text not null,
  domain_id text not null,
  capability_id text,
  why_essential text,
  research_question text not null,
  current_hypothesis text,
  priority text not null,
  criticality text,
  status text not null default 'open',
  fastest_research_route text,
  required_evidence_type text,
  owner text,
  next_action text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_summary text,
  classification text not null default 'internal',
  updated_at timestamptz not null default now()
);

create table if not exists gap_systems (
  gap_id text not null references gaps(id) on delete cascade,
  system_id text not null references systems(id) on delete cascade,
  primary key (gap_id, system_id)
);

create table if not exists research_tasks (
  id text primary key,
  gap_id text references gaps(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  priority text,
  assignee text,
  due_date date,
  result_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programmes (
  id text primary key,
  name text not null,
  status text,
  scope text,
  geography text,
  timeline text,
  evidence_status text,
  open_questions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists programme_systems (
  programme_id text not null references programmes(id) on delete cascade,
  system_id text not null references systems(id) on delete cascade,
  role text not null,
  primary key (programme_id, system_id, role)
);

create table if not exists stakeholders (
  id text primary key,
  full_name text not null,
  job_title text,
  function_area text,
  linkedin_url text,
  email text,
  source_id text references evidence_sources(id),
  classification text not null default 'private',
  confidence_score integer check (confidence_score between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ownership_links (
  id text primary key,
  stakeholder_id text not null references stakeholders(id) on delete cascade,
  subject_type text not null,
  subject_id text not null,
  ownership_role text not null,
  status text not null,
  confidence_score integer check (confidence_score between 0 and 100),
  source_id text references evidence_sources(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists architecture_views (
  id text primary key,
  title text not null,
  subtitle text,
  canvas jsonb not null,
  rules jsonb not null,
  version text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists architecture_view_groups (
  id text primary key,
  view_id text not null references architecture_views(id) on delete cascade,
  label text not null,
  x numeric not null,
  y numeric not null,
  w numeric not null,
  h numeric not null,
  sort_order integer not null default 0
);

create table if not exists architecture_view_nodes (
  id text primary key,
  view_id text not null references architecture_views(id) on delete cascade,
  group_id text references architecture_view_groups(id) on delete cascade,
  kind text not null,
  title text not null,
  subtitle text,
  vendor_id text references vendors(id),
  catalog_refs jsonb not null default '[]'::jsonb,
  status text,
  evidence text,
  modules jsonb not null default '[]'::jsonb,
  gap_priority text,
  x numeric not null,
  y numeric not null,
  w numeric not null,
  h numeric not null,
  sort_order integer not null default 0
);

create table if not exists architecture_view_edges (
  id text primary key,
  view_id text not null references architecture_views(id) on delete cascade,
  source_node_id text not null references architecture_view_nodes(id) on delete cascade,
  target_node_id text not null references architecture_view_nodes(id) on delete cascade,
  type text not null,
  label text,
  points jsonb not null,
  dashed boolean not null default false,
  canonical_relationship_ids jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists audit_events (
  id bigserial primary key,
  actor_id text,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_systems_vendor on systems(vendor_id);
create index if not exists idx_systems_domain on systems(domain_id);
create index if not exists idx_systems_status on systems(deployment_status);
create index if not exists idx_claims_subject on claims(subject_type, subject_id);
create index if not exists idx_edges_source on architecture_relationships(source_system_id);
create index if not exists idx_edges_target on architecture_relationships(target_system_id);
create index if not exists idx_gaps_status_priority on gaps(status, priority);
create index if not exists idx_view_nodes_view on architecture_view_nodes(view_id);
create index if not exists idx_view_edges_view on architecture_view_edges(view_id);
