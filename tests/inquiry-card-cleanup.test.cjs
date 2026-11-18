'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
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
