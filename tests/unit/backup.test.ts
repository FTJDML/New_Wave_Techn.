import { describe, expect, it } from 'vitest';
import { BACKUP_TABLES, buildBackupFilename, buildBackupPayload } from '../../src/lib/backup';

describe('BACKUP_TABLES', () => {
  it('lists every table declared in the schema, with no duplicates', () => {
    expect(BACKUP_TABLES.length).toBe(new Set(BACKUP_TABLES).size);
    expect(BACKUP_TABLES).toContain('vendors');
    expect(BACKUP_TABLES).toContain('stakeholders');
    expect(BACKUP_TABLES).toContain('ownership_links');
    expect(BACKUP_TABLES).toContain('audit_events');
  });

  it('orders foreign-key parents before their dependents, mirroring the seed script', () => {
    expect(BACKUP_TABLES.indexOf('vendors')).toBeLessThan(BACKUP_TABLES.indexOf('systems'));
    expect(BACKUP_TABLES.indexOf('systems')).toBeLessThan(BACKUP_TABLES.indexOf('system_capabilities'));
    expect(BACKUP_TABLES.indexOf('gaps')).toBeLessThan(BACKUP_TABLES.indexOf('gap_systems'));
    expect(BACKUP_TABLES.indexOf('stakeholders')).toBeLessThan(BACKUP_TABLES.indexOf('ownership_links'));
  });
});

describe('buildBackupPayload', () => {
  it('groups successful results under tables and keeps the requested timestamp', () => {
    const payload = buildBackupPayload('2026-08-06T12:00:00.000Z', [
      { table: 'vendors', rows: [{ id: 'VEN-1' }], error: null },
      { table: 'systems', rows: [{ id: 'SYS-1' }, { id: 'SYS-2' }], error: null },
    ]);
    expect(payload.generatedAt).toBe('2026-08-06T12:00:00.000Z');
    expect(payload.tables.vendors).toEqual([{ id: 'VEN-1' }]);
    expect(payload.tables.systems).toHaveLength(2);
    expect(payload.errors).toEqual({});
  });

  it('routes a failed table into errors instead of tables, and omits it from tables entirely', () => {
    const payload = buildBackupPayload('2026-08-06T12:00:00.000Z', [{ table: 'gaps', rows: null, error: 'relation "gaps" does not exist' }]);
    expect(payload.errors.gaps).toBe('relation "gaps" does not exist');
    expect(payload.tables.gaps).toBeUndefined();
  });

  it('defaults a null rows array to an empty array for a successful, empty table', () => {
    const payload = buildBackupPayload('2026-08-06T12:00:00.000Z', [{ table: 'audit_events', rows: null, error: null }]);
    expect(payload.tables.audit_events).toEqual([]);
  });

  it('handles a mix of successful and failed tables in the same run', () => {
    const payload = buildBackupPayload('2026-08-06T12:00:00.000Z', [
      { table: 'vendors', rows: [{ id: 'VEN-1' }], error: null },
      { table: 'gaps', rows: null, error: 'timeout' },
    ]);
    expect(Object.keys(payload.tables)).toEqual(['vendors']);
    expect(Object.keys(payload.errors)).toEqual(['gaps']);
  });
});

describe('buildBackupFilename', () => {
  it('sanitizes colons and dots out of an ISO timestamp so it is a valid filename', () => {
    expect(buildBackupFilename('2026-08-06T12:03:25.123Z')).toBe('action-architecture-backup-2026-08-06T12-03-25-123Z.json');
  });

  it('is otherwise deterministic for the same input', () => {
    const a = buildBackupFilename('2026-01-01T00:00:00.000Z');
    const b = buildBackupFilename('2026-01-01T00:00:00.000Z');
    expect(a).toBe(b);
  });
});
