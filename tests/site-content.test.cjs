'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const match = app.match(/const initial=(\{[\s\S]*?\});\s*let state;/);
assert.ok(match, 'Initial content should be readable for validation');
const initial = vm.runInNewContext('(' + match[1] + ')');

test('Sean\'s three programs and age groups are accurate', () => {
  assert.deepEqual(Array.from(initial.programs, p => p.title.replace(/\n/g, ' ')), ['CROSS COUNTRY', 'SPRINTS', 'OPEN TRAINING']);
  assert.deepEqual(Array.from(initial.programs, p => p.type), ['Competitive', 'Competitive', 'Non-competitive']);
  for (const p of initial.programs) {
    assert.equal(p.groups.length, 3);
    assert.ok(p.groups.includes('Junior High'));
    assert.ok(p.groups.includes('High School'));
  }
  assert.equal(initial.programs[0].groups[2], 'College / Open');
  assert.equal(initial.programs[1].groups[2], 'College / Open');
  assert.equal(initial.programs[2].groups[2], 'Adult / Open');
});

test('seven real photo references including high jump are present in gallery', () => {
  assert.equal(initial.gallery.length, 7);
  assert.equal(new Set(Array.from(initial.gallery, g => g.id)).size, 7);
  assert.equal(initial.gallery.at(-1).image, 'assets/high-jump.webp');
  assert.equal(initial.gallery.at(-1).caption, 'HIGH JUMP IN ACTION');
  assert.ok(initial.gallery.every(g => g.image.startsWith('assets/') && g.image.endsWith('.webp')));
  assert.equal(new Set(Array.from(initial.gallery, g => g.image)).size, 7);
});

test('homepage and program cards reference authentic photographs', () => {
  assert.equal(initial.media.hero, 'assets/coach-alumni.webp');
  assert.equal(initial.media.studio, 'assets/coach-finn-medal.webp');
  assert.ok(initial.programs.every(p => p.image?.startsWith('assets/')));
  assert.ok(html.includes('assets/coach-alumni.webp'));
  assert.ok(app.includes('applyImageFallbacks()'));
  assert.ok(css.includes('.photo-not-loaded'));
});

test('removed slogan is absent from the default public copy', () => {
  const publicCopy = [html, initial.hero.description, initial.about.text, initial.about.quote].join(' ').toLowerCase();
  assert.doesNotMatch(publicCopy, /small town|big city|philosophy/);
});

test('photo files exist before this branch is released', () => {
  const expected = new Set([
    ...Object.values(initial.media),
    ...Array.from(initial.gallery, g => g.image),
    ...Array.from(initial.programs, p => p.image)
  ]);
  const missing = Array.from(expected).filter(file => !fs.existsSync(path.join(root, file)));
  assert.deepEqual(missing, [], 'Upload the optimized photo files in assets/ before merging this PR');
});

test('admin offers replacement controls for every photo placement', () => {
  assert.match(app, /data-upload="\$\{key\}"/);
  assert.match(app, /data-program-upload="\$\{esc\(p\.id\)\}"/);
  assert.match(app, /data-gallery-upload="\$\{esc\(g\.id\)\}"/);
  assert.match(app, /data-reset-program-photo/);
  assert.match(app, /data-media-reset/);
  assert.match(app, /Program photo uploaded. Publishing.../);
  assert.match(app, /Gallery image uploaded. Publishing.../);
});
test('uploaded photos have input validation and error-state recovery', () => {
  assert.match(app, /image\/png,image\/jpeg,image\/webp/);
  assert.match(app, /15\*1024\*1024/);
  assert.match(app, /addEventListener\('load'/);
  assert.match(app, /remove\('photo-not-loaded'\)/);
});

test('Supabase admin wiring is enabled and browser-only writes are removed', () => {
 const backend=fs.readFileSync(path.join(root, 'bulldogs-backend.js'),'utf8');
 assert.match(html,/bulldogs-backend\.js/);
 assert.match(html,/admin-login-form/);
 assert.match(app,/refreshAdminAuth/);
 assert.match(app,/loadSiteContent/);
 assert.match(app,/saveUploadedPhoto/);
 assert.doesNotMatch(app,/localStorage\.setItem/);
 assert.match(backend,/bulldogs_content/);
 assert.match(backend,/bulldogs_admins/);
 assert.match(backend,/bulldogs-media/);
 assert.match(backend,/currentAdmin\(\)/);
 assert.doesNotMatch(backend,/service_role|sb_secret_/);
});
