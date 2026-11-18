'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');

test('restore defaults uses current approved Bulldogs branding and photography',()=>{
 assert.match(app,/logo:'https:\/\/raw\.githubusercontent\.com\/Amber-E-Moseri\/bulldogs-track-field\/main\/assets\/logo-transparent\.webp'/);
 for (const file of ['coach-alumni.webp','coach-finn-medal.webp','championship-podium.webp','sprints-track.webp','open-training.webp','sprints-action.webp','high-jump.webp'])
   assert.ok(app.includes('assets/'+file),'approved asset in default content: '+file);
});

test('restore website defaults is clearly labelled and warns about published edits',()=>{
 assert.match(app,/RESTORE WEBSITE DEFAULTS/);
 assert.match(app,/Restore website defaults/);
 assert.match(app,/Download a backup first/);
 assert.match(app,/The website layout stays unchanged/);
 assert.doesNotMatch(app,/RESET ALL DEMO CONTENT|Restored original demo/);
 assert.match(app,/This replaces all published Admin Studio edits/);
});

test('restore still requires authorization, fully loaded content and confirmation before save',()=>{
 assert.match(app,/if\(t\.id==='reset-all'\)\{if\(!adminAuthorized\)/);
 assert.match(app,/if\(!loadCompleted\)/);
 assert.match(app,/if\(confirm\('Restore the approved Bulldogs website defaults\?/);
 assert.match(app,/state=structuredClone\(initial\);if\(persist\(\)\)/);
 assert.match(app,/Check save status/);
});

test('restore is content-only: gallery, programs and FAQs remain in built-in baseline',()=>{
 assert.match(app,/gallery:\[\{id:'g1'/);
 assert.match(app,/programs:\[\{id:'p1'/);
 assert.match(app,/faq:\[\{"id":"faq1"/);
 assert.match(app,/inquiries:\[\]/);
});
