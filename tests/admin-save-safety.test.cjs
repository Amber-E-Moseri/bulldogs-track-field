'use strict';
// Admin safety invariants and executable CSV export behavior.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

test('saves are refused until content loads, checked before the save state changes',()=>{
  const start=app.indexOf('function persist()'),end=app.indexOf('async function saveUploadedPhoto',start);
  const body=app.slice(start,end);
  assert.ok(body.indexOf('if(!adminAuthorized)')<body.indexOf('if(!loadCompleted)'));
  assert.ok(body.indexOf('if(!loadCompleted)')<body.indexOf("setSaveStatus('Unsaved changes')"));
});

test('saves are refused until published content has loaded, so a failed load cannot overwrite live content with baseline defaults', () => {
  const persist = app.match(/function persist\(\)\{[\s\S]*?\n\}/);
  assert.ok(persist, 'persist() found');
  assert.match(persist[0], /if\(!loadCompleted\)\{[^}]*Changes were not saved/);
  // The guard must run before any snapshot is queued for the backend.
  assert.ok(persist[0].indexOf('loadCompleted') < persist[0].indexOf('saveContent'));
});

test('a failed content load leaves loadCompleted false (the guard depends on this)', () => {
  const loader = app.match(/async function loadSiteContent\(\)\{[\s\S]*?\n\}/);
  assert.ok(loader, 'loadSiteContent() found');
  assert.match(loader[0], /loadCompleted=true;[\s\S]*catch\(e\)/);
  assert.doesNotMatch(loader[0].split('catch')[1] || '', /loadCompleted=true/);
});

test('Overview inquiry count reads the real admin inbox, not the always-empty published state', () => {
  assert.match(app, /REACH OUT INQUIRIES<\/div><div class="big">\$\{inbox\.length\}<\/div>/);
  assert.doesNotMatch(app, /\$\{state\.inquiries\.length\}/);
});

test('program title line breaks are converted with a real newline regex (not a literal backslash-n)', () => {
  const programCard=app.slice(app.indexOf("$('#program-grid').innerHTML="),app.indexOf("renderPricing();"));
  assert.doesNotMatch(programCard, /replace\(\/\\\\n\/g/);
  assert.match(app, /data-ask-program="\$\{esc\(p\.title\.replace\(\/\\n\/g,' '\)\)\}"/);
});

test('CSV export neutralises spreadsheet formula injection in every cell', () => {
  const helper = app.match(/const csvCell=v=>[^\n]*;/);
  assert.ok(helper, 'csvCell helper found');
  const sandbox = {};
  vm.runInNewContext(helper[0] + ';this.csvCell=csvCell;', sandbox);
  const { csvCell } = sandbox;
  assert.equal(csvCell('=HYPERLINK("http://x")'), '"\'=HYPERLINK(""http://x"")"');
  assert.equal(csvCell('+1 555'), '"\'+1 555"');
  assert.equal(csvCell('-cmd'), '"\'-cmd"');
  assert.equal(csvCell('@SUM(A1)'), '"\'@SUM(A1)"');
  assert.equal(csvCell('\t=x'), '"\'\t=x"');
  assert.equal(csvCell('  @sum'), '"\'  @sum"');
  assert.equal(csvCell('\t-HYPERLINK'), '"\'\t-HYPERLINK"');
  assert.equal(csvCell('\n=cmd'), '"\'\n=cmd"');
  assert.equal(csvCell('Jane "JJ" Doe'), '"Jane ""JJ"" Doe"');
  assert.equal(csvCell('parent@example.com'), '"parent@example.com"');
  assert.equal(csvCell(null), '""');
  assert.match(app, /rows\.map\(r=>r\.map\(csvCell\)\.join\(','\)\)/);
});

test('photo uploads accept only the advertised JPEG, PNG and WebP formats', () => {
  assert.match(app, /if\(!\['image\/jpeg','image\/png','image\/webp'\]\.includes\(file\?\.type\)\)/);
  assert.doesNotMatch(app, /startsWith\('image\/'\)\)\{flash\('Please choose an image/);
});
