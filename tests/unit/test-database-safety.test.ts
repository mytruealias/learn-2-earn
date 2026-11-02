import { describe, it, expect, vi } from 'vitest';
import { getTestDatabaseUrl, assertTestDatabase } from '../../lib/test-database-safety';
const name = 'l2e_test_' + 'a'.repeat(24);
const url = `postgresql://${name}:test-only@127.0.0.1:5432/${name}?schema=public`;
const valid = { DATABASE_URL: url, DATABASE_URL_TEST: url, TEST_DATABASE_NONCE: 'b'.repeat(64) };

describe('test isolation refuses accidental targets', () => {
  it('requires harness capability and identical app/test bindings', () => {
    expect(() => getTestDatabaseUrl({ DATABASE_URL: url })).toThrow();
    expect(() => getTestDatabaseUrl({ ...valid, TEST_DATABASE_NONCE: undefined })).toThrow();
    expect(() => getTestDatabaseUrl({ ...valid, DATABASE_URL: 'postgresql://localhost/development' })).toThrow();
  });
  it.each([
    url.replace('127.0.0.1', 'database.example.com'), url.replace(`/${name}?`, '/production_test?'),
    url.replace(`${name}:test-only@`, 'postgres:test-only@'), url.replace('schema=public', 'schema=other'),
    'not-a-url', url.replace('postgresql:', 'https:'),
  ])('rejects remote, arbitrary, privileged or malformed bindings', value => {
    expect(() => getTestDatabaseUrl({ ...valid, DATABASE_URL: value, DATABASE_URL_TEST: value })).toThrow();
  });
  it('accepts structural harness binding but still demands server-side proof', async () => {
    expect(getTestDatabaseUrl(valid)).toBe(url);
    vi.stubEnv('DATABASE_URL', url); vi.stubEnv('DATABASE_URL_TEST', url); vi.stubEnv('TEST_DATABASE_NONCE', valid.TEST_DATABASE_NONCE);
    try {
      for (const rows of [[], [{ database: name, username: name, owner: name, privileged: true }],
        [{ database: name, username: name, owner: 'other', privileged: false }]]) {
        const client = { $queryRaw: vi.fn().mockResolvedValue(rows) };
        await expect(assertTestDatabase(client as never)).rejects.toThrow('verification failed');
      }
      const client = { $queryRaw: vi.fn().mockResolvedValueOnce([{ database: name, username: name, owner: name, privileged: false }]).mockResolvedValueOnce([]) };
      await expect(assertTestDatabase(client as never)).rejects.toThrow('verification failed');
    } finally { vi.unstubAllEnvs(); }
  });
});
