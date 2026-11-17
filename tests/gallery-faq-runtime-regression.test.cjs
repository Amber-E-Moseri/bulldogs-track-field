'use strict';
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'premium.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
test('public renderer updates all brand logos without calling forEach on a single node',()=>{
 assert.match(app,/\$\$\('\[data-media\]'\)\.forEach\(el=>/);
 assert.doesNotMatch(app,/(?<!\$)\$\('\[data-media\]'\)\.forEach/);
});
test('FAQ data and fallback questions are rendered when live content only overrides branding',()=>{
 assert.match(app,/clean\.faq=Array\.isArray\(content\.faq\)\?content\.faq:initial\.faq/);
 assert.match(app,/faqGrid\.innerHTML=\(Array\.isArray\(state\.faq\)\?state\.faq:\[\]\)/);
 assert.match(html,/id="faq"/);
 assert.match(html,/id="faq-grid"/);
 assert.match(app,/Does my athlete need experience\?/);
 assert.match(app,/When is the next intake\?/);
});
test('gallery stays scrollable with only three unique images',()=>{
 assert.match(app,/function publicGalleryItems\(\)/);
 assert.match(css,/#public-site \.gallery-grid .gallery-tile\{flex:0 0 calc\(56% - 8px\)/);
 assert.match(css,/overflow-x:auto!important/);
 assert.match(css,/scroll-snap-type:x mandatory/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
 assert.match(css,/#public-site \.gallery-nav button:disabled/);
});
