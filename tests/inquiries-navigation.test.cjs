'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const backend = fs.readFileSync(path.join(root, 'bulldogs-backend.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

function harness({ authorized=true, userId='member-1', fail=null }={}){
 const calls=[];
 const client={
  auth:{getSession:async()=>({data:{session:userId?{user:{id:userId}}:null},error:null})},
  from(table){
   calls.push(['from',table]);
   const q={
    select(cols){calls.push(['select',table,cols]);return q},
    eq(col,val){calls.push(['eq',table,col,val]);return q},
    order(col,opts){calls.push(['order',table,col,opts]);return q},
    limit(n){calls.push(['limit',table,n]);return q},
    async maybeSingle(){return {data:authorized?{user_id:userId}:null,error:null}},
    async insert(row){calls.push(['insert',table,row]);return {data:null,error:fail=== 'insert'?new Error('Insert denied'):null}},
    delete(){calls.push(['delete',table]);return q},
    then(resolve,reject){return Promise.resolve({data:[{id:'abc',name:'Sam',email:'sam@example.com',message:'Hi'}],error:fail==='list'?new Error('List denied'):null}).then(resolve,reject)}
   };
   return q;
  },
  storage:{from(){throw Error('No storage allowed in inquiry tests')}}
 };
 const window={supabase:{createClient:()=>client}};
 vm.runInNewContext(backend,{window,Date,crypto:{randomUUID:()=> 'test-id'}});
 return {api:window.BulldogsAPI,calls};
}

test('public Reach Out form is wired to the backend, with a real submit button',()=>{
 assert.match(html,/id="contact-form"/);
 assert.match(html,/id="send-inquiry"[^>]*type="submit"|type="submit"[^>]*id="send-inquiry"/);
 assert.match(app,/submitInquiry\(payload\)/);
 assert.match(app,/formSubmitting/);
 assert.match(app,/form\.reset\(\)/);
 assert.match(html,/name="website"/);
 assert.match(app,/data\.get\('website'\)/);
 assert.doesNotMatch(html,/This form is not yet accepting submissions/);
});

test('public visitor may submit without signing in; no read-back of inquiries',async()=>{
 const {api,calls}=harness({userId:null});
 const outcome=await api.submitInquiry({name:'  Sam ',email:' sam@example.com ',event:'Sprints',message:' Coaching please '});
 assert.equal(outcome,true);
 const writes=calls.filter(c=>c[0]==='insert');
 assert.equal(writes.length,1);
 assert.equal(writes[0][1],'bulldogs_inquiries');
 assert.equal(writes[0][2].name,'Sam');
 assert.equal(writes[0][2].email,'sam@example.com');
 assert.equal(writes[0][2].message,'Coaching please');
 assert.equal(calls.filter(c=>c[0]==='select').length,0);
});

test('contact input must include valid bounded name, email and goals',async()=>{
 const {api,calls}=harness({userId:null});
 for(const payload of [
  {name:'',email:'sam@example.com',message:'Hi'},
  {name:'S',email:'invalid',message:'Hi'},
  {name:'S',email:'sam@example.com',message:' '},
  {name:'S',email:'sam@example.com',message:'x'.repeat(2501)}
 ])await assert.rejects(api.submitInquiry(payload));
 assert.equal(calls.filter(c=>c[0]==='insert').length,0);
});

test('public submission failures are returned to the caller',async()=>{
 const {api}=harness({userId:null,fail:'insert'});
 await assert.rejects(api.submitInquiry({name:'Sam',email:'sam@example.com',message:'Help'}),/Insert denied/);
});

test('inbox is admin-only and ordered with newest first',async()=>{
 const outsider=harness({userId:null});
 await assert.rejects(outsider.api.listInquiries(),/Only Bulldogs admins/);
 const member=harness();
 const rows=await member.api.listInquiries();
 assert.equal(rows.length,1);
 assert.ok(member.calls.some(c=>c[0]==='select'&&c[1]==='bulldogs_inquiries'));
 assert.ok(member.calls.some(c=>c[0]==='order'&&c[2]==='created_at'&&c[3].ascending===false));
 assert.ok(member.calls.some(c=>c[0]==='limit'&&c[2]===200));
});

test('admin inquiry deletion requires authorization and a valid identifier',async()=>{
 const owner=harness();
 await assert.rejects(owner.api.deleteInquiry('not-uuid'),/Invalid inquiry/);
 const id='4b868b15-3a2a-4ef3-898c-557e500062c1';
 assert.equal(await owner.api.deleteInquiry(id),true);
 assert.ok(owner.calls.some(c=>c[0]==='delete'&&c[1]==='bulldogs_inquiries'));
 assert.ok(owner.calls.some(c=>c[0]==='eq'&&c[2]==='id'&&c[3]===id));
 const visitor=harness({userId:null});
 await assert.rejects(visitor.api.deleteInquiry(id),/Only Bulldogs admins/);
});

test('admin renders fetched inquiries rather than browser-local inquiries',()=>{
 assert.match(app,/listInquiries\(\)/);
 assert.match(app,/inbox\.map\(inquiryRow\)/);
 assert.match(app,/deleteInquiry\(t\.dataset\.deleteInquiry\)/);
 assert.match(app,/refresh-inquiries/);
 assert.match(app,/inbox\.map\(q=>\[/);
});

test('section three is a carousel with controls and touch scrolling',()=>{
 assert.match(html,/id="gallery-prev"/);
 assert.match(html,/id="gallery-next"/);
 assert.match(html,/id="gallery-grid"/);
 assert.match(app,/function setGalleryIndex/);
 assert.match(css,/scroll-snap-type:x mandatory/);
 assert.match(css,/touch-action:pan-x pan-y/);
});

test('navigation anchors scroll to sections, and coach/cross-country images avoid cropping',()=>{
 assert.match(html,/href="#join-team">WORK WITH SEAN/);
 assert.match(app,/scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
 assert.match(css,/\.about-image>img\{object-fit:contain!important/);
 assert.match(css,/\.program-card:first-child \.program-photo img\{object-fit:contain!important/);
 assert.match(css,/\.hero-photo:after\{/);
});

test('admin shell stays hidden on the public page',()=>{
 assert.match(html,/<section id="admin-app" hidden/);
 assert.match(css,/\[hidden\]\{display:none!important\}/);
 assert.match(css,/#admin-app\[hidden\]/);
 assert.match(css,/#admin-app\.locked>\.auth-wall\{display:grid/);
});
test('studio navigation, admin content, and image previews have responsive layouts',()=>{
 assert.match(css,/\.admin-sidebar\{position:sticky/);
 assert.match(css,/\.admin-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:560px\)/);
 assert.match(css,/\.brand img\[data-media=logo\]/);
});
