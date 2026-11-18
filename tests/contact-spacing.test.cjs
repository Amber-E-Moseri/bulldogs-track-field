'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),css=fs.readFileSync(path.join(base,'style.css'),'utf8'),app=fs.readFileSync(path.join(base,'app.js'),'utf8');
test('contact details appear once, near heading and before join form',()=>{
 assert.equal((html.match(/mailto:medicinehatbulldogstrackclub@gmail\.com/g)||[]).length,1);
 assert.equal((html.match(/id="instagram-link"/g)||[]).length,1);
 assert.ok(html.indexOf('class="contact-direct"')<html.indexOf('<form id="contact-form"'));
 assert.doesNotMatch(html,/contact-backups/);
});
test('contact area provides responsive direct-detail hierarchy and unclipped text',()=>{
 assert.match(css,/#public-site \.contact-direct\{/);
 assert.match(css,/#public-site \.contact-method-value\{/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/#public-site \.contact form\{min-width:0;margin:0\}/);
 assert.match(css,/@media\(max-width:760px\)/);
});
test('website inquiry and Instagram editor integration remain intact',()=>{
 assert.match(app,/\$\('#instagram-link'\)\.href=/);
 assert.match(html,/id="send-inquiry"/);
 assert.match(app,/requireBackend\(\)\.submitInquiry\(payload\)/);
});
