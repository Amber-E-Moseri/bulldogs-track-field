'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const crest=fs.readFileSync(path.join(root,'assets/logo-transparent.webp'));
test('site uses the approved Bulldogs crest consistently',()=>{
 assert.doesNotMatch(html,/assets\/logo\.webp/);
 assert.doesNotMatch(app,/assets\/logo\.webp/);
 assert.doesNotMatch(css,/assets\/logo\.webp/);
 assert.match(html,/data-media="logo" src="assets\/logo-transparent\.webp"/);
 assert.match(app,/logo:'https:\/\/raw\.githubusercontent\.com\/Amber-E-Moseri\/bulldogs-track-field\/main\/assets\/logo-transparent\.webp'/);
 assert.match(css,/--bulldogs-crest,url\('assets\/logo-transparent\.webp'\)/);
});
test('crest is a genuine WebP image, not an empty placeholder',()=>{
 assert.ok(crest.length>2000);
 assert.equal(crest.toString('ascii',0,4),'RIFF');
 assert.equal(crest.toString('ascii',8,12),'WEBP');
});
test('published logo also drives the subtle crest watermark',()=>{
 assert.match(app,/setProperty\('--bulldogs-crest'/);
});
test('remove redundant join form descriptions and outdated email caveat',()=>{
 assert.doesNotMatch(html,/Tell Sean about the athlete, their age group and what they want to work on/);
 assert.doesNotMatch(html,/Your request goes to the Bulldogs admin inbox for a response/);
 assert.doesNotMatch(html,/Confirm the club email is still actively monitored/);
 assert.match(html,/id="form-status" role="status"><\/div>/);
 assert.match(html,/medicinehatbulldogstrackclub@gmail\.com/);
 assert.match(html,/id="send-inquiry"/);
});
