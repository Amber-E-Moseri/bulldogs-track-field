'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');

test('hero has fluid heading sizing and no inherited nowrap at laptop widths',()=>{
 assert.match(css,/\.hero h1\{?[\s\S]*?white-space:normal/);
 assert.match(css,/#public-site \.hero h1\{font-size:clamp\(42px,4\.6vw,78px\);/);
 assert.match(css,/#public-site \.hero-copy\{padding:clamp\(40px,6vw,77px\) 5% 45px 10\.8%;justify-content:center;min-width:0;max-width:100%\}/);
 assert.match(css,/#public-site \.hero h1\{font-size:clamp\(39px,9vw,52px\)\}/);
 assert.doesNotMatch(css,/white-space:nowrap\}\.hero h1 em/);
});

test('the about, hero and contact copy serve distinct purposes',()=>{
 assert.match(html,/01 \/ THE COACH/);
 assert.match(html,/COACHING IN<br><i>MEDICINE HAT\.<\/i>/);
 assert.match(html,/06 \/ CONTACT<\/span><span>QUESTIONS & REGISTRATION/);
 assert.match(html,/QUESTIONS ABOUT<br><i>TRAINING\?<\/i>/);
 assert.match(html,/SEND A TRAINING REQUEST/);
 assert.doesNotMatch(html,/06 \/ GET IN TOUCH<\/span><span>GET IN TOUCH/);
 assert.match(js,/heading:'COACHING IN\\nMEDICINE HAT\.'/);
});

test('the stylesheet stays consolidated while preserving program and admin rules',()=>{
 assert.match(html,/href="style\.css"/);
 assert.doesNotMatch(html,/href="premium\.css"/);
 assert.match(css,/#public-site \.program-card/);
 assert.match(css,/#admin-app/);
 assert.match(css,/\n:root \{\n/);
});
