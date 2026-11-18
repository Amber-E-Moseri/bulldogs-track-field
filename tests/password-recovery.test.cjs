'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const backend=fs.readFileSync(path.join(root,'bulldogs-backend.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');

test('login includes recovery request and new password forms without exposing signup',()=>{
 assert.doesNotMatch(html,/id="forgot-password-link"|Forgot password\?/);
 assert.match(html,/id="admin-recovery-request-form" hidden/);
 assert.match(html,/id="admin-new-password-form" hidden/);
 assert.match(html,/autocomplete="new-password" minlength="12"/);
 assert.match(html,/aria-live="polite"/);
 assert.doesNotMatch(html,/id="admin-signup-form"/);
 assert.match(css,/\.auth-card form\[hidden\],\.auth-card button\[hidden\]\{display:none!important\}/);
});

test('recovery request uses Supabase SDK and caller-supplied Bulldogs-only callback',()=>{
 assert.match(backend,/client\.auth\.resetPasswordForEmail\(email,\{redirectTo\}\)/);
 assert.match(app,/const callback='https:\/\/bulldogs-track-field\.vercel\.app\/\?bulldogs_recovery=1'/);
 assert.match(app,/requireBackend\(\)\.requestPasswordReset\(email,callback\)/);
 assert.match(app,/If this email is eligible/);
 assert.doesNotMatch(backend,/signUp\(/);
});

test('callback is routed to Bulldogs studio even when hash holds a token',()=>{
 assert.match(app,/const isAdmin=recoveryCallback\(\)\|\|location\.hash==='#admin'/);
 assert.match(app,/showAuthMode\(adminAuthorized\?'reset':'request'\)/);
 assert.match(app,/if\(wall\)wall\.hidden=adminAuthorized&&!recovery/);
 assert.match(app,/if\(app\)app\.classList\.toggle\('locked',!adminAuthorized\|\|recovery\)/);
});

test('changing a recovered password requires actual Bulldogs admin membership',()=>{
 assert.match(backend,/async function changeRecoveredPassword\(password\)/);
 assert.match(backend,/if\(!\(await currentAdmin\(\)\)\)throw Error\('This identity is not a Bulldogs administrator\.'\)/);
 assert.match(backend,/client\.auth\.updateUser\(\{password\}\)/);
 assert.match(app,/password\.length<12/);
 assert.match(app,/password!==confirmation/);
 assert.match(app,/requireBackend\(\)\.changeRecoveredPassword\(password\)/);
});

test('successful recovery signs out and clears the recovery query parameter',()=>{
 assert.match(app,/await requireBackend\(\)\.logout\(\)/);
 assert.match(app,/url\.searchParams\.delete\('bulldogs_recovery'\);url\.hash='admin'/);
 assert.match(app,/Password updated\. Sign in with your new password\./);
});

test('Bulldogs recovery does not add database tables, global auth configuration, or privileged keys',()=>{
 assert.match(backend,/storageKey:'bulldogs-auth-v1'/);
 assert.doesNotMatch(backend,/service_role|sb_secret_/);
 assert.doesNotMatch(app,/ALTER TABLE|CREATE POLICY|auth\.admin\./i);
});

test('neutral shared email template uses Supabase official confirmation link',()=>{
 const template=fs.readFileSync(path.join(root,'auth-templates','password-recovery.html'),'utf8');
 assert.match(template,/<title>Reset your password<\/title>/);
 assert.match(template,/href="{{ \.ConfirmationURL }}"/);
 assert.match(template,/ACCOUNT SECURITY/);
 assert.doesNotMatch(template,/Bulldogs|Pearl Studio|ambermoseri\.vercel\.app/i);
 assert.doesNotMatch(template,/{{ \.SiteURL }}/);
});
