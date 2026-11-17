'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'premium.css'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');

test('premium styling loads on the public website and leaves admin scoped separately',()=>{
 assert.match(html,/href="premium\.css"/);
 assert.match(css,/#public-site \.nav\.is-scrolled/);
 assert.match(css,/#public-site \.program-card:hover/);
 assert.match(css,/#public-site \.manifesto::before/);
 assert.match(css,/#public-site \.scroll-reveal\.is-visible/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/#admin-app/);
});

test('mobile hero shows copy and primary CTA before photo',()=>{
 assert.match(html,/<div class="hero-copy">[\s\S]*?href="#join-team">START YOUR JOURNEY[\s\S]*?<div class="hero-photo">/);
 assert.match(css,/#public-site \.hero-copy\{order:0/);
 assert.match(css,/#public-site \.hero-photo\{order:1/);
 assert.match(css,/@media\(max-width:760px\)/);
});

test('shared program schedule note replaces three copies of placeholder pricing',()=>{
 assert.match(html,/class="programs-shared-note"/);
 assert.match(html,/Training times, venues, seasons and fees vary by program/);
 assert.match(app,/const prices=state\.programs\.filter/);
 assert.match(app,/wrapper\.hidden=prices\.length===0/);
 assert.doesNotMatch(app,/class="program-facts"/);
 assert.doesNotMatch(app,/class="program-price"/);
 assert.match(app,/TRAINING GROUPS/);
});

test('gallery omits currently featured images while retaining admin source records',()=>{
 assert.match(app,/function publicGalleryItems\(\)/);
 assert.match(app,/state\.media\.hero,state\.media\.studio/);
 assert.match(app,/!featured\.has\(item\.image\)/);
 assert.match(app,/data-lightbox="\$\{g\.originalIndex\}"/);
 assert.match(app,/galleryItems\.length/);
 assert.match(app,/state\.gallery\.map\(galleryRow\)/);
});

test('guardian fields are legible and accurately required for minors',()=>{
 assert.match(html,/id="guardian-fields" hidden aria-label="Parent or guardian contact details"/);
 assert.match(html,/Parent or guardian details are required for athletes under 18/);
 assert.match(css,/#public-site \.contact #guardian-fields\{background:#ffffff0d/);
 assert.match(css,/#public-site \.contact #guardian-fields label\{color:#fff/);
 assert.match(css,/#public-site \.contact #guardian-fields input\{color:#fff/);
 assert.match(app,/function updateGuardianFields\(\)/);
 assert.match(app,/input\.required=required;input\.disabled=!required/);
 assert.match(app,/form\.reset\(\);updateGuardianFields\(\)/);
 assert.match(app,/requireBackend\(\)\.submitInquiry\(payload\)/);
});

test('admin image processing preserves transparent logos and declared WebP storage type',()=>{
 assert.match(app,/canvas\.toDataURL\('image\/webp',\.82\)/);
 assert.doesNotMatch(app,/canvas\.toDataURL\('image\/jpeg'/);
});
test('multi-card gallery navigation is based on actual tile positions',()=>{
 assert.match(app,/tiles\[galleryIndex\]\.offsetLeft-tiles\[0\]\.offsetLeft/);
 assert.match(css,/flex:0 0 min\(48%,420px\)/);
});
