'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const files=['coach-alumni.webp','coach-finn-medal.webp','sprints-track.webp','open-training.webp','sprints-action.webp','championship-podium.webp','high-jump.webp'];
test('all seven approved Bulldogs photos are nonempty, optimized WebP assets',()=>{
 for(const filename of files){
  const file=fs.readFileSync(path.join(root,'assets',filename));
  assert.ok(file.byteLength>25000,filename+' unexpectedly small');
  assert.equal(file.toString('ascii',0,4),'RIFF',filename);
  assert.equal(file.toString('ascii',8,12),'WEBP',filename);
  assert.ok(file.byteLength<500000,filename+' is too large for mobile');
 }
});
test('site and Supabase-backed default content keep pointing to the new assets',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(app,/hero:'assets\/coach-alumni\.webp'/);
 assert.match(app,/studio:'assets\/coach-finn-medal\.webp'/);
 assert.match(app,/team:'assets\/championship-podium\.webp'/);
 assert.match(app,/image:'assets\/sprints-track\.webp'/);
 assert.match(app,/image:'assets\/open-training\.webp'/);
 assert.match(html,/src="assets\/coach-alumni\.webp"/);
});
