'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const backendSource = fs.readFileSync(path.join(__dirname, '..', 'bulldogs-backend.js'), 'utf8');

function backendHarness({
  userId = 'owner-123',
  authorized = true,
  content = { hero: { headline: 'Track training' } },
  errors = {},
} = {}) {
  const calls = [];
  const sampleUrl = 'https://example.supabase.co';
  const sampleImageUrl = 'https://example.supabase.co/storage/v1/object/public/bulldogs-media/';
  const client = {
    auth: {
      async getSession() {
        calls.push(['getSession']);
        if (errors.session) return { data: null, error: new Error(errors.session) };
        return { data: { session: userId ? { user: { id: userId } } : null }, error: null };
      },
      async signInWithPassword(credentials) {
        calls.push(['login', credentials]);
        if (errors.login) return { data: null, error: new Error(errors.login) };
        return { data: { user: { id: userId } }, error: null };
      },
      async signOut() {
        calls.push(['logout']);
        if (errors.logout) return { data: null, error: new Error(errors.logout) };
        return { data: {}, error: null };
      },
    },
    from(table) {
      calls.push(['from', table]);
      const query = {
        select(fields) {
          calls.push(['select', table, fields]);
          return query;
        },
        eq(column, value) {
          calls.push(['eq', table, column, value]);
          return query;
        },
        update(value) {
          calls.push(['update', table, value]);
          return query;
        },
        async maybeSingle() {
          calls.push(['maybeSingle', table]);
          return errors.admin
            ? { data: null, error: new Error(errors.admin) }
            : { data: authorized ? { user_id: userId } : null, error: null };
        },
        async single() {
          calls.push(['single', table]);
          if (errors[table]) return { data: null, error: new Error(errors[table]) };
          return table === 'bulldogs_content'
            ? { data: calls.some(c => c[0] === 'update') ? { id: 'main' } : { content }, error: null }
            : { data: null, error: new Error('Unexpected table') };
        },
      };
      return query;
    },
    storage: {
      from(bucket) {
        calls.push(['bucket', bucket]);
        return {
          async upload(file, blob, options) {
            calls.push(['upload', bucket, file, blob, options]);
            return errors.upload ? { error: new Error(errors.upload) } : { error: null };
          },
          getPublicUrl(file) {
            calls.push(['getPublicUrl', bucket, file]);
            return { data: { publicUrl: sampleImageUrl + file } };
          },
        };
      },
    },
  };
  const window = {
    supabase: {
      createClient(url, key, options) {
        calls.push(['createClient', url, key, options]);
        return client;
      },
    },
  };
  vm.runInNewContext(backendSource, { window, crypto: { randomUUID: () => 'fixed-uuid' }, Date }, { filename: 'bulldogs-backend.js' });
  return { api: window.BulldogsAPI, calls, sampleUrl, sampleImageUrl };
}

const callsNamed = (calls, name) => calls.filter(c => c[0] === name);

test('client uses publishable credentials and a separate Bulldogs auth storage key', () => {
  const { calls } = backendHarness();
  const [_, url, key, opts] = callsNamed(calls, 'createClient')[0];
  assert.match(url, /^https:\/\/[a-z0-9-]+\.supabase\.co$/);
  assert.match(key, /^sb_publishable_/);
  assert.equal(opts.auth.storageKey, 'bulldogs-auth-v1');
  assert.equal(opts.auth.persistSession, true);
  assert.doesNotMatch(backendSource, /service_role|sb_secret_/);
});

test('missing SDK fails closed instead of silently creating a dummy client', () => {
  const window = {};
  vm.runInNewContext(backendSource, { window });
  assert.match(window.BulldogsAPI.error, /could not load/i);
  assert.equal(window.BulldogsAPI.saveContent, undefined);
});

test('logged out visitors are not administrators and no membership is queried', async () => {
  const { api, calls } = backendHarness({ userId: null });
  assert.equal(await api.currentAdmin(), false);
  assert.equal(callsNamed(calls, 'from').length, 0);
});

test('only explicit Bulldogs membership authorizes an administrator', async () => {
  const owner = backendHarness();
  assert.equal(await owner.api.currentAdmin(), true);
  assert.deepEqual(Array.from(callsNamed(owner.calls, 'from'), c => c[1]), ['bulldogs_admins']);
  assert.deepEqual(Array.from(callsNamed(owner.calls, 'eq')[0].slice(1)), ['bulldogs_admins', 'user_id', 'owner-123']);
  const outsider = backendHarness({ authorized: false });
  assert.equal(await outsider.api.currentAdmin(), false);
});

test('membership query errors fail closed', async () => {
  const { api } = backendHarness({ errors: { admin: 'Permission denied' } });
  await assert.rejects(api.currentAdmin(), /Permission denied/);
});

test('published site reads only Bulldogs content', async () => {
  const { api, calls } = backendHarness({ userId: null });
  assert.equal((await api.getContent()).hero.headline, 'Track training');
  assert.deepEqual(Array.from(callsNamed(calls, 'from'), c => c[1]), ['bulldogs_content']);
  assert.equal(callsNamed(calls, 'eq')[0][2], 'id');
  assert.equal(callsNamed(calls, 'eq')[0][3], 'main');
});

test('database read failures propagate to the caller', async () => {
  const { api } = backendHarness({ errors: { bulldogs_content: 'Read unavailable' } });
  await assert.rejects(api.getContent(), /Read unavailable/);
});

test('logged-out and nonadmin users cannot publish website content', async () => {
  for (const params of [{ userId: null }, { authorized: false }]) {
    const { api, calls } = backendHarness(params);
    await assert.rejects(api.saveContent({ hero: { headline: 'Unauthorized' } }), /not authorized/);
    assert.equal(callsNamed(calls, 'update').length, 0);
  }
});

test('authorized content updates target only the main Bulldogs record', async () => {
  const { api, calls } = backendHarness();
  const value = { hero: { headline: 'Updated' }, gallery: [] };
  assert.equal(await api.saveContent(value), true);
  const updates = callsNamed(calls, 'update');
  assert.equal(updates.length, 1);
  assert.equal(updates[0][1], 'bulldogs_content');
  assert.equal(updates[0][2].content, value);
  assert.ok(typeof updates[0][2].updated_at === 'string');
  assert.ok(calls.some(c => c[0] === 'eq' && c[1] === 'bulldogs_content' && c[2] === 'id' && c[3] === 'main'));
});

test('content save rejects database errors and missing returned rows', async () => {
  const denied = backendHarness({ errors: { bulldogs_content: 'RLS denied' } });
  await assert.rejects(denied.api.saveContent({}), /RLS denied/);
  const missing = backendHarness();
  const oldSingle = missing.api.client.from;
  missing.api.client.from = function (table) {
    const query = oldSingle.call(this, table);
    if (table === 'bulldogs_content') query.single = async () => ({ data: null, error: null });
    return query;
  };
  await assert.rejects(missing.api.saveContent({}), /was not saved/);
});

test('upload disallows unauthenticated and nonadmin visitors', async () => {
  for (const params of [{ userId: null }, { authorized: false }]) {
    const { api, calls } = backendHarness(params);
    await assert.rejects(api.uploadPhoto({ size: 250, type: 'image/webp' }), /Only Bulldogs admins/);
    assert.equal(callsNamed(calls, 'upload').length, 0);
  }
});

test('upload rejects missing or oversized images before touching storage', async () => {
  const { api, calls } = backendHarness();
  await assert.rejects(api.uploadPhoto(null), /smaller than 10MB/);
  await assert.rejects(api.uploadPhoto({ size: 10 * 1024 * 1024 + 1 }), /smaller than 10MB/);
  assert.equal(callsNamed(calls, 'upload').length, 0);
});

test('uploaded photos go to Bulldogs bucket using a fresh non-overwriting path', async () => {
  const { api, calls, sampleImageUrl } = backendHarness();
  const blob = { size: 500, type: 'image/webp' };
  const result = await api.uploadPhoto(blob);
  const [_, bucket, file, uploaded, options] = callsNamed(calls, 'upload')[0];
  assert.equal(bucket, 'bulldogs-media');
  assert.equal(file, 'site/fixed-uuid.webp');
  assert.equal(uploaded, blob);
  assert.equal(options.contentType, 'image/webp');
  assert.equal(options.upsert, false);
  assert.equal(result, sampleImageUrl + file);
});

test('storage errors propagate without returning an invalid photo URL', async () => {
  const { api, calls } = backendHarness({ errors: { upload: 'Storage denied' } });
  await assert.rejects(api.uploadPhoto({ size: 500 }), /Storage denied/);
  assert.equal(callsNamed(calls, 'getPublicUrl').length, 0);
});

test('login and logout use Supabase Auth without changing unrelated site permissions', async () => {
  const { api, calls } = backendHarness();
  assert.equal((await api.login('coach@example.com', 'secret')).user.id, 'owner-123');
  await api.logout();
  assert.equal(callsNamed(calls, 'login')[0][1].email, 'coach@example.com');
  assert.equal(callsNamed(calls, 'logout').length, 1);
  assert.equal(callsNamed(calls, 'from').length, 0);
});

test('login errors are surfaced to the UI', async () => {
  const { api } = backendHarness({ errors: { login: 'Invalid credentials' } });
  await assert.rejects(api.login('wrong@example.com', 'bad'), /Invalid credentials/);
});
