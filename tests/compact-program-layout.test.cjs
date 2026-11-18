'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),css=fs.readFileSync(path.join(root,'style.css'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');
test('program cards size to their contents instead of stretching to tallest card',()=>{
 assert.match(css,/#public-site \.program-grid\{\s*align-items:start;/);
 assert.match(css,/#public-site \.program-card\{\s*min-height:0!important;/);
 assert.match(css,/#public-site \.program-card>p\{\s*min-height:0!important;/);
 assert.match(css,/#public-site \.program-card \.card-bottom\{\s*margin-top:0!important;/);
});
test('image, groups, buttons and footers retain deliberate compact spacing',()=>{
 assert.match(css,/#public-site \.program-card \.program-photo\{\s*height:155px;/);
 assert.match(css,/#public-site \.program-card \.training-groups\{\s*margin:0 0 12px;/);
 assert.match(css,/#public-site \.program-card \.program-ask\{\s*margin:8px 0 16px;/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(app,/class="program-card"/);
});
