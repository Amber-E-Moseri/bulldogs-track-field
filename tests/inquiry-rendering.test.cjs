'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const vm=require('node:vm');
const css=fs.readFileSync(path.join(__dirname,'..','style.css'),'utf8');

test('successful inquiry shows a short request received confirmation',()=>{
 assert.match(app,/note\.textContent='Request received\.';/);
 assert.doesNotMatch(app,/The program currently shows/);
});
test('inbox handles old literal backslash-n separators and genuine newlines',()=>{
 const normalize=x=>String(x||'').replace(/\\n/g,'\n').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
 assert.deepEqual(normalize('Program: Sprints\\nGroup: High School\\nGoals: Improve speed'),['Program: Sprints','Group: High School','Goals: Improve speed']);
 assert.deepEqual(normalize('Goals: Improve speed\nSource: Google'),['Goals: Improve speed','Source: Google']);
 assert.match(app,/String\(q\.message\|\|''\)\.replace\(\/\\\\n\/g,'\\n'\)/);
});
test('inbox avoids repeating program and price while retaining other fields',()=>{
 assert.match(app,/filter\(line=>!\/\^\(Program\|Group\|Displayed price\):\/i\.test\(line\)\)/);
 assert.match(app,/esc\(line\)/);
 assert.match(app,/inquiry-card/);
 assert.match(css,/\.inquiry-details/);
});

test('real inquiryRow output formats legacy submissions and escapes user-supplied markup',()=>{
 const start=app.indexOf('function inquiryRow(q){');
 const end=app.indexOf('\nasync function refreshInquiries(',start);
 assert.ok(start>=0&&end>start,'inquiryRow is extractable');
 const sandbox={};
 const helper="const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));";
 vm.runInNewContext(helper+app.slice(start,end)+';this.render=inquiryRow;',sandbox);
 const result=sandbox.render({id:'inquiry-1',name:'Test <script>',email:'test@example.com',event:'Cross Country / Junior High',created_at:'2026-11-18T16:00:00Z',message:'Program: Cross Country\\nGroup: Junior High\\nSource: Word of mouth\\nGoals: Improve pace\\nDisplayed price: $'});
 assert.match(result,/Test &lt;script&gt;/);
 assert.match(result,/Goals: Improve pace/);
 assert.match(result,/Source: Word of mouth/);
 assert.doesNotMatch(result,/\\n|Displayed price:|<script>/);
 assert.equal((result.match(/Cross Country \/ Junior High/g)||[]).length,1);
});
