-- Row-level security policies.
--
-- Starting posture chosen explicitly by the product owner for Phase 5 (see
-- docs/PHASE5_REVIEW_REPORT.md §2): any authenticated user may read every classification,
-- including `private`/`restricted` stakeholder and ownership data. This is deliberately the
-- simplest correct policy, not a permanent design — a role-tiered policy (e.g. only
-- `researcher`/`admin` roles may read `restricted` rows) is the documented next step if
-- finer-grained access is ever needed; nothing here blocks adding that later.
--
-- Three access tiers, applied per table below:
--   A. Has its own `classification` column (systems, commercial_relationships,
--      evidence_sources, claims, gaps, stakeholders): anon reads only classification =
--      'public'; authenticated reads everything.
--   B. No classification column, not privacy-sensitive — this is exactly the catalogue data
--      Phases 1–3 already rendered to anyone with the app's URL, with no login: anon and
--      authenticated both read everything.
--   C. Privacy-adjacent with no classification column of its own (`ownership_links`,
--      `audit_events`): anon reads nothing; authenticated reads everything.
-- Every table, in every tier: writes (insert/update/delete) require authenticated.

-- Tier A ---------------------------------------------------------------------------------

alter table systems enable row level security;
create policy systems_select_anon on systems for select to anon using (classification = 'public');
create policy systems_select_auth on systems for select to authenticated using (true);
create policy systems_write_auth on systems for all to authenticated using (true) with check (true);

alter table commercial_relationships enable row level security;
create policy commercial_relationships_select_anon on commercial_relationships for select to anon using (classification = 'public');
create policy commercial_relationships_select_auth on commercial_relationships for select to authenticated using (true);
create policy commercial_relationships_write_auth on commercial_relationships for all to authenticated using (true) with check (true);

alter table evidence_sources enable row level security;
create policy evidence_sources_select_anon on evidence_sources for select to anon using (classification = 'public');
create policy evidence_sources_select_auth on evidence_sources for select to authenticated using (true);
create policy evidence_sources_write_auth on evidence_sources for all to authenticated using (true) with check (true);

alter table claims enable row level security;
create policy claims_select_anon on claims for select to anon using (classification = 'public');
create policy claims_select_auth on claims for select to authenticated using (true);
create policy claims_write_auth on claims for all to authenticated using (true) with check (true);

alter table gaps enable row level security;
create policy gaps_select_anon on gaps for select to anon using (classification = 'public');
create policy gaps_select_auth on gaps for select to authenticated using (true);
create policy gaps_write_auth on gaps for all to authenticated using (true) with check (true);

alter table stakeholders enable row level security;
create policy stakeholders_select_anon on stakeholders for select to anon using (classification = 'public');
create policy stakeholders_select_auth on stakeholders for select to authenticated using (true);
create policy stakeholders_write_auth on stakeholders for all to authenticated using (true) with check (true);

-- Tier B ---------------------------------------------------------------------------------

alter table vendors enable row level security;
create policy vendors_select_all on vendors for select to anon, authenticated using (true);
create policy vendors_write_auth on vendors for all to authenticated using (true) with check (true);

alter table capabilities enable row level security;
create policy capabilities_select_all on capabilities for select to anon, authenticated using (true);
create policy capabilities_write_auth on capabilities for all to authenticated using (true) with check (true);

alter table system_capabilities enable row level security;
create policy system_capabilities_select_all on system_capabilities for select to anon, authenticated using (true);
create policy system_capabilities_write_auth on system_capabilities for all to authenticated using (true) with check (true);

alter table commercial_relationship_systems enable row level security;
create policy commercial_relationship_systems_select_all on commercial_relationship_systems for select to anon, authenticated using (true);
create policy commercial_relationship_systems_write_auth on commercial_relationship_systems for all to authenticated using (true) with check (true);

alter table claim_sources enable row level security;
create policy claim_sources_select_all on claim_sources for select to anon, authenticated using (true);
create policy claim_sources_write_auth on claim_sources for all to authenticated using (true) with check (true);

alter table system_sources enable row level security;
create policy system_sources_select_all on system_sources for select to anon, authenticated using (true);
create policy system_sources_write_auth on system_sources for all to authenticated using (true) with check (true);

alter table architecture_relationships enable row level security;
create policy architecture_relationships_select_all on architecture_relationships for select to anon, authenticated using (true);
create policy architecture_relationships_write_auth on architecture_relationships for all to authenticated using (true) with check (true);

alter table architecture_relationship_sources enable row level security;
create policy architecture_relationship_sources_select_all on architecture_relationship_sources for select to anon, authenticated using (true);
create policy architecture_relationship_sources_write_auth on architecture_relationship_sources for all to authenticated using (true) with check (true);

alter table technical_observations enable row level security;
create policy technical_observations_select_all on technical_observations for select to anon, authenticated using (true);
create policy technical_observations_write_auth on technical_observations for all to authenticated using (true) with check (true);

alter table gap_systems enable row level security;
create policy gap_systems_select_all on gap_systems for select to anon, authenticated using (true);
create policy gap_systems_write_auth on gap_systems for all to authenticated using (true) with check (true);

alter table research_tasks enable row level security;
create policy research_tasks_select_all on research_tasks for select to anon, authenticated using (true);
create policy research_tasks_write_auth on research_tasks for all to authenticated using (true) with check (true);

alter table programmes enable row level security;
create policy programmes_select_all on programmes for select to anon, authenticated using (true);
create policy programmes_write_auth on programmes for all to authenticated using (true) with check (true);

alter table programme_systems enable row level security;
create policy programme_systems_select_all on programme_systems for select to anon, authenticated using (true);
create policy programme_systems_write_auth on programme_systems for all to authenticated using (true) with check (true);

alter table architecture_views enable row level security;
create policy architecture_views_select_all on architecture_views for select to anon, authenticated using (true);
create policy architecture_views_write_auth on architecture_views for all to authenticated using (true) with check (true);

alter table architecture_view_groups enable row level security;
create policy architecture_view_groups_select_all on architecture_view_groups for select to anon, authenticated using (true);
create policy architecture_view_groups_write_auth on architecture_view_groups for all to authenticated using (true) with check (true);

alter table architecture_view_nodes enable row level security;
create policy architecture_view_nodes_select_all on architecture_view_nodes for select to anon, authenticated using (true);
create policy architecture_view_nodes_write_auth on architecture_view_nodes for all to authenticated using (true) with check (true);

alter table architecture_view_edges enable row level security;
create policy architecture_view_edges_select_all on architecture_view_edges for select to anon, authenticated using (true);
create policy architecture_view_edges_write_auth on architecture_view_edges for all to authenticated using (true) with check (true);

-- Tier C ---------------------------------------------------------------------------------

alter table ownership_links enable row level security;
create policy ownership_links_select_auth on ownership_links for select to authenticated using (true);
create policy ownership_links_write_auth on ownership_links for all to authenticated using (true) with check (true);

alter table audit_events enable row level security;
create policy audit_events_select_auth on audit_events for select to authenticated using (true);
create policy audit_events_insert_auth on audit_events for insert to authenticated with check (true);
