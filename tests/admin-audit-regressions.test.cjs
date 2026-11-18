'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');

test('editing is blocked until published content finishes loading',()=>{
 const start=app.indexOf('function persist()'),end=app.indexOf('async function saveUploadedPhoto',start);
 const body=app.slice(start,end);
 assert.ok(start>=0 && end>start);
 assert.ok(body.indexOf('if(!adminAuthorized)')<body.indexOf('if(!loadCompleted)'));
 assert.ok(body.indexOf('if(!loadCompleted)')<body.indexOf('setSaveStatus(\'Unsaved changes\')'));
 assert.match(body,/Changes are blocked to protect published data/);
});

test('inquiry dashboard count uses fetched inbox rather than empty content state',()=>{
 assert.match(app,/<div class="card-label">REACH OUT INQUIRIES<\/div><div class="big">\$\{inbox.length\}/);
 assert.doesNotMatch(app,/\$\{state.inquiries.length\}/);
});

test('program title labels strip actual newline characters for form preselect',()=>{
 assert.ok((app.match(/replace\(\/\\n\/g,' '\)/g)||[]).length>=3);
 assert.doesNotMatch(app,/replace\(\/\\\\n\/g,' '\)/);
});

test('image upload accepts only JPEG PNG or WebP',()=>{
 assert.match(app,/\['image\/jpeg','image\/png','image\/webp'\]\.includes\(file\.type\)/);
 assert.doesNotMatch(app,/file\?\.type\.startsWith\('image\/'\)/);
});

test('CSV escaping neutralizes formulas, leading whitespace, and quotes',()=>{
 const match=app.match(/function csvCell\(value\)\{[^\n]+\}/);
 assert.ok(match,'CSV helper exists');
 const csvCell=vm.runInNewContext('('+match[0]+')');
 assert.equal(csvCell('=1+2'),'"\'=1+2"');
 assert.equal(csvCell('+SUM(A1:A2)'),'"\'+SUM(A1:A2)"');
 assert.equal(csvCell('  @sum'),'"\'  @sum"');
 assert.equal(csvCell('\t-HYPERLINK'),'"\'\t-HYPERLINK"');
 assert.equal(csvCell('normal "quote"'),'"normal ""quote"""');
 assert.equal(csvCell('test@example.com'),'"test@example.com"');
 assert.match(app,/rows\.map\(r=>r\.map\(csvCell\)\.join\(','\)\)/);
});
