'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname,'..');
const html = fs.readFileSync(path.join(root,'admin','index.html'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const main = fs.readFileSync(path.join(root,'index.html'),'utf8');

function redirectFrom(href) {
 const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(script, 'admin route contains redirect script');
 let redirected;
 const win = { location: { href, replace(next){redirected=next;} } };
 vm.runInNewContext(script, {window:win, URL}, {timeout:1000});
 return redirected;
}

test('GitHub Pages project admin redirects to correct hashed admin entry',()=>{
 assert.equal(redirectFrom('https://amber-e-moseri.github.io/bulldogs-track-field/admin/'),
  'https://amber-e-moseri.github.io/bulldogs-track-field/#admin');
});

test('root domain /admin/ also redirects correctly, without hard-coded project prefix',()=>{
 assert.equal(redirectFrom('https://bulldogs-track-field.vercel.app/admin/'),
  'https://bulldogs-track-field.vercel.app/#admin');
});

test('admin page provides fallback link, branding, and noindex',()=>{
 assert.match(html,/id="admin-login-link" href="\.\.\/#admin"/);
 assert.match(html,/name="robots" content="noindex, nofollow"/);
 assert.match(html,/Bulldogs Admin Studio/);
});

test('redirect lands on the existing Supabase-authorized studio, not a second public editor',()=>{
 assert.match(app,/location\.hash==='#admin'/);
 assert.match(app,/async function refreshAdminAuth\(\)/);
 assert.match(app,/requireBackend\(\)\.currentAdmin\(\)/);
 assert.match(main,/<section id="admin-app" hidden/);
 assert.match(main,/id="admin-login-form"/);
});
