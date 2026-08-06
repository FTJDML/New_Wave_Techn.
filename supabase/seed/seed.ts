// Idempotent seed runner for the Phase 5 Supabase schema (supabase/migrations/0001_schema.sql).
//
// Reads the canonical JSON bundle (src/data/action-architecture-data.json), maps every record
// through the pure functions in mappers.ts (unit-tested in tests/unit/seedMappers.test.ts), and
// upserts each table via a service-role Supabase client. Upserts key on each table's primary key,
// so running this script repeatedly against the same project converges rather than duplicating
// rows — no live database has been used to verify this end to end (see docs/PHASE5_REVIEW_REPORT.md
// §1 for exactly what has and hasn't run).
//
// Deliberately not seeded in this phase:
//   - `fullResearchCatalogue.cgi_relationships` — no table exists for it (see migrations/0001).
//   - `architecture_views` / `architecture_view_groups` / `architecture_view_nodes` /
//     `architecture_view_edges` — the app still renders all curated views from the local JSON
//     bundle (per CLAUDE.md, "database and authentication come only after the visual golden path
//     is approved"); migrating view rendering to read from Supabase is out of scope for the
//     persistence-and-auth phase and is not required by any Phase 5 acceptance bullet.
//   - `audit_events` — an append-only log that starts empty; nothing to backfill.
//
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx supabase/seed/seed.ts
// Without both env vars, this exits 0 with a clear message and touches nothing.

import { createClient } from '@supabase/supabase-js';
import bundle from '../../src/data/action-architecture-data.json' with { type: 'json' };
import {
  mapVendor,
  mapSystem,
  mapCapability,
  mapSystemCapability,
  mapCommercialRelationship,
  mapEvidenceSource,
  mapClaim,
  mapTechnicalObservation,
  mapGap,
  mapResearchTask,
  mapProgramme,
  mapStakeholder,
  mapOwnershipLink,
  mapArchitectureRelationship,
  extractGapSystems,
  extractClaimSources,
  extractSystemSources,
  extractArchitectureRelationshipSources,
  extractCommercialRelationshipSystems,
  extractProgrammeSystems,
} from './mappers';

interface Bundle {
  readonly curatedArchitecture: { readonly logoRegistry: Record<string, { strategy?: string; slug?: string; assetPath?: string; text?: string }> };
  readonly fullResearchCatalogue: {
    readonly vendors: readonly Record<string, unknown>[];
    readonly components: readonly Record<string, unknown>[];
    readonly capabilities: readonly Record<string, unknown>[];
    readonly component_capabilities: readonly Record<string, unknown>[];
    readonly commercial_relationships: readonly Record<string, unknown>[];
    readonly evidence_sources: readonly Record<string, unknown>[];
    readonly claims: readonly Record<string, unknown>[];
    readonly architecture_edges: readonly Record<string, unknown>[];
    readonly technical_observations: readonly Record<string, unknown>[];
    readonly research_gaps: readonly Record<string, unknown>[];
    readonly research_tasks: readonly Record<string, unknown>[];
    readonly programmes: readonly Record<string, unknown>[];
    readonly stakeholders: readonly Record<string, unknown>[];
    readonly ownership_links: readonly Record<string, unknown>[];
  };
}

const frc = (bundle as unknown as Bundle).fullResearchCatalogue;
const logoRegistry = (bundle as unknown as Bundle).curatedArchitecture.logoRegistry;

interface UpsertStep {
  readonly table: string;
  readonly conflictKey: string;
  readonly rows: readonly object[];
}

function buildSteps(): UpsertStep[] {
  return [
    { table: 'vendors', conflictKey: 'id', rows: frc.vendors.map((v) => mapVendor(v, logoRegistry)) },
    { table: 'systems', conflictKey: 'id', rows: frc.components.map(mapSystem) },
    { table: 'capabilities', conflictKey: 'id', rows: frc.capabilities.map(mapCapability) },
    { table: 'system_capabilities', conflictKey: 'system_id,capability_id', rows: frc.component_capabilities.map(mapSystemCapability) },
    { table: 'commercial_relationships', conflictKey: 'id', rows: frc.commercial_relationships.map(mapCommercialRelationship) },
    { table: 'commercial_relationship_systems', conflictKey: 'relationship_id,system_id', rows: frc.commercial_relationships.flatMap(extractCommercialRelationshipSystems) },
    { table: 'evidence_sources', conflictKey: 'id', rows: frc.evidence_sources.map(mapEvidenceSource) },
    { table: 'claims', conflictKey: 'id', rows: frc.claims.map(mapClaim) },
    { table: 'claim_sources', conflictKey: 'claim_id,source_id', rows: frc.claims.flatMap(extractClaimSources) },
    { table: 'system_sources', conflictKey: 'system_id,source_id', rows: frc.components.flatMap(extractSystemSources) },
    { table: 'architecture_relationships', conflictKey: 'id', rows: frc.architecture_edges.map(mapArchitectureRelationship) },
    { table: 'architecture_relationship_sources', conflictKey: 'relationship_id,source_id', rows: frc.architecture_edges.flatMap(extractArchitectureRelationshipSources) },
    { table: 'technical_observations', conflictKey: 'id', rows: frc.technical_observations.map(mapTechnicalObservation) },
    { table: 'gaps', conflictKey: 'id', rows: frc.research_gaps.map(mapGap) },
    { table: 'gap_systems', conflictKey: 'gap_id,system_id', rows: frc.research_gaps.flatMap(extractGapSystems) },
    { table: 'research_tasks', conflictKey: 'id', rows: frc.research_tasks.map(mapResearchTask) },
    { table: 'programmes', conflictKey: 'id', rows: frc.programmes.map(mapProgramme) },
    { table: 'programme_systems', conflictKey: 'programme_id,system_id,role', rows: frc.programmes.flatMap(extractProgrammeSystems) },
    { table: 'stakeholders', conflictKey: 'id', rows: frc.stakeholders.map(mapStakeholder) },
    { table: 'ownership_links', conflictKey: 'id', rows: frc.ownership_links.map(mapOwnershipLink) },
  ];
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.log(
      'seed: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not set — no database to seed. ' +
        'This is expected until a real Supabase project is provisioned (see README "Setting up Supabase"). Exiting without doing anything.',
    );
    return;
  }

  const client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const steps = buildSteps();

  for (const step of steps) {
    if (step.rows.length === 0) continue;
    const { error } = await client.from(step.table).upsert(step.rows, { onConflict: step.conflictKey });
    if (error) {
      throw new Error(`seed: upsert into "${step.table}" failed: ${error.message}`);
    }
    console.log(`seed: upserted ${step.rows.length} row(s) into "${step.table}"`);
  }

  console.log('seed: done.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
