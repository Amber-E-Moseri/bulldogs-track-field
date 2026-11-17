/* Bulldogs Track & Field: secure Supabase-backed content studio. */
(()=>{'use strict';
const STORAGE='bulldogs_studio_v3';
const initial={brand:{name:'BULLDOGS',sub:'TRACK & FIELD CLUB',logo:'assets/logo.webp',instagram:'https://www.instagram.com/bulldogs.trackandfield/'},hero:{headline:'BUILT FOR\nTHE NEXT\nLEVEL.',description:'Cross country, sprint training and open training for athletes who want to improve their running and fitness.'},about:{heading:'A COACH WHO\nSEES YOUR\nPOTENTIAL.',text:'Sean Freeman works with athletes in cross country, sprints and general fitness. His sessions focus on technique, consistent training and helping each athlete progress at their own pace.',quote:'Consistent training makes a difference.'},media:{hero:'assets/coach-alumni.webp',studio:'assets/coach-finn-medal.webp',team:'assets/championship-podium.webp'},stats:[{value:'3×',label:'DIVISION 2\nCLUB OF THE YEAR'},{value:'01',label:'COACH.\nPERSONAL FOCUS.'},{value:'100%',label:'COMMITMENT\nTO THE WORK.'}],programs:[{id:'p1',title:'CROSS\nCOUNTRY',subtitle:'DISTANCE RUNNING',description:'Distance running with opportunities to train and compete in cross-country meets.',image:'assets/coach-finn-medal.webp',type:'Competitive',groups:['Junior High','High School','College / Open']},{id:'p2',title:'SPRINTS',subtitle:'SPEED & TECHNIQUE',description:'Sprint training focused on speed, technique, acceleration and race performance.',image:'assets/sprints-track.webp',type:'Competitive',groups:['Junior High','High School','College / Open']},{id:'p3',title:'OPEN\nTRAINING',subtitle:'RUNNING & FITNESS',description:'Structured training for people who want to improve their running, fitness and athletic ability without competing.',image:'assets/open-training.webp',type:'Non-competitive',groups:['Junior High','High School','Adult / Open']}],gallery:[{id:'g1',image:'assets/coach-alumni.webp',caption:'SEAN WITH FORMER ATHLETES'},{id:'g2',image:'assets/sprints-track.webp',caption:'SPRINT TRAINING'},{id:'g3',image:'assets/open-training.webp',caption:'ON THE TRACK'},{id:'g4',image:'assets/sprints-action.webp',caption:'TRAINING SESSION'},{id:'g5',image:'assets/championship-podium.webp',caption:'ALBERTA INDOOR CHAMPIONSHIPS'},{id:'g6',image:'assets/coach-finn-medal.webp',caption:'CROSS-COUNTRY MEDAL'},{id:'g7',image:'assets/high-jump.webp',caption:'HIGH JUMP IN ACTION'}],inquiries:[]};
let state=structuredClone(initial);
let adminAuthorized=false, syncTimer=null, saveQueue=Promise.resolve(), loadCompleted=false;
let inbox=[], inboxError='', galleryIndex=0, formSubmitting=false;
const api=window.BulldogsAPI;
function setSaveStatus(value){const el=document.querySelector('#save-state');if(el)el.textContent=value}
function requireBackend(){if(!api?.client)throw Error(api?.error||'Unable to connect to the content server.');return api}
function persist(){
 if(!adminAuthorized){flash('Please sign in before making changes.');return false}
 setSaveStatus('Unsaved changes');
 clearTimeout(syncTimer);
 const snapshot=JSON.parse(JSON.stringify(state));
 syncTimer=setTimeout(()=>{
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
   setSaveStatus('Saving...');
   try{await requireBackend().saveContent(snapshot);setSaveStatus('Saved to website')}
   catch(e){setSaveStatus('Save failed');flash('Changes not saved: '+(e.message||'Please retry'))}
  });
 },650);
 return true;
}
async function saveUploadedPhoto(file,callback){
 loadImage(file,async dataURL=>{
  try{
   if(!adminAuthorized)throw Error('Sign in to upload photos');
   const blob=await (await fetch(dataURL)).blob();
   const url=await requireBackend().uploadPhoto(blob);
   callback(url);
  }catch(e){flash('Upload failed: '+(e.message||'Please retry'))}
 });
}
async function loadSiteContent(){
 try{
  const content=await requireBackend().getContent();
  if(content && typeof content==='object'&&!Array.isArray(content)&&Object.keys(content).length){
   const clean={...initial,...content};
   clean.brand={...initial.brand,...(content.brand||{})};
   clean.hero={...initial.hero,...(content.hero||{})};
   clean.about={...initial.about,...(content.about||{})};
   clean.media={...initial.media,...(content.media||{})};
   clean.programs=Array.isArray(content.programs)?content.programs:initial.programs;
   clean.gallery=Array.isArray(content.gallery)?content.gallery:initial.gallery;
   clean.stats=Array.isArray(content.stats)?content.stats:initial.stats;
   clean.inquiries=[];
   state=clean;
  }
  loadCompleted=true;
  renderSite();
 }catch(e){console.error('Could not load Bulldogs content',e);const note=document.querySelector('#form-status');if(note)note.textContent='Website content is temporarily unavailable.'}
}
async function refreshAdminAuth(){
 try{adminAuthorized=await requireBackend().currentAdmin()}catch(e){adminAuthorized=false;const note=document.querySelector('#auth-message');if(note)note.textContent='Connection error: '+e.message}
 const wall=document.querySelector('#auth-wall');
 const app=document.querySelector('#admin-app');
 if(wall)wall.hidden=adminAuthorized;
 if(app)app.classList.toggle('locked',!adminAuthorized);
 if(adminAuthorized){adminRender();await refreshInquiries();}
 else if(document.querySelector('#auth-message')?.textContent==='Loading secure admin...')document.querySelector('#auth-message').textContent='Only authorized Bulldogs administrators can sign in.';
 return adminAuthorized;
}
let tab='overview';const $=sel=>document.querySelector(sel);const $$=sel=>Array.from(document.querySelectorAll(sel));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nl=v=>esc(v).replace(/\n/g,'<br>');
const htmlTitle=(v)=>{let parts=String(v).split('\n');return parts.map((s,i)=>i===1||i===parts.length-1?`<em>${esc(s)}</em>`:esc(s)).join('<br>')};
function flash(message){document.querySelector('.toast')?.remove();const div=document.createElement('div');div.className='toast';div.textContent=message;document.body.append(div);setTimeout(()=>div.remove(),3000)}
/* Persist via authenticated Supabase updates; never store published content in browser localStorage. */
function setDeep(section,key,value){state[section][key]=value;persist();renderSite()}
function applyImageFallbacks(){document.querySelectorAll('img').forEach(img=>{if(img.dataset.imageFallbackSet)return;img.dataset.imageFallbackSet='1';const container=img.closest('.hero-photo,.about-image,.program-photo,.gallery-tile,.admin-preview,.media-edit');img.addEventListener('error',()=>{img.classList.add('missing-real-photo');container?.classList.add('photo-not-loaded')});img.addEventListener('load',()=>{img.classList.remove('missing-real-photo');if(container&&!container.querySelector('img.missing-real-photo'))container.classList.remove('photo-not-loaded')});})}
function renderSite(){
 $('#hero-headline').innerHTML=htmlTitle(state.hero.headline);$('#hero-description').textContent=state.hero.description;
 $('#about-heading').innerHTML=htmlTitle(state.about.heading);$('#about-text').textContent=state.about.text;$('#coach-quote').textContent='“'+state.about.quote+'”';
 $$('.brand span').forEach(el=>{el.innerHTML=esc(state.brand.name)+'<small>'+esc(state.brand.sub)+'</small>'});
 $$('[data-media]').forEach(el=>{const key=el.dataset.media;el.src=key==='logo'?state.brand.logo:state.media[key]});
 $('#instagram-link').href=/^https:\/\//.test(state.brand.instagram)?state.brand.instagram:'https://www.instagram.com/bulldogs.trackandfield/';
 $('#stat-row').innerHTML=state.stats.map(s=>`<div><strong>${esc(s.value)}</strong><span>${nl(s.label)}</span></div>`).join('');
 $('#program-grid').innerHTML=state.programs.map((p,i)=>`<article class="program-card"><span class="number">0${i+1} / TRAINING</span><span class="program-type ${p.type==='Non-competitive'?'noncompetitive':''}">${esc(p.type||'Competitive')}</span><h3>${nl(p.title)}</h3><div class="program-photo"><img loading="lazy" src="${esc(p.image||'')}" alt="${esc(p.title.replace(/\n/g,' '))} training photograph"></div><p>${esc(p.description)}</p><div class="training-groups"><strong>TRAINING GROUPS</strong><ul>${(Array.isArray(p.groups)?p.groups:[]).map(group=>`<li>${esc(group)}</li>`).join('')}</ul></div><div class="card-bottom"><span>${esc(p.subtitle||'ATHLETE DEVELOPMENT')}</span><span>↗</span></div></article>`).join('');
 $('#gallery-grid').innerHTML=state.gallery.map((g,i)=>`<button class="gallery-tile" data-lightbox="${i}" aria-label="View ${esc(g.caption)}" tabindex="${i===galleryIndex?'0':'-1'}"><img loading="lazy" src="${esc(g.image)}" alt="${esc(g.caption)}"><span class="caption">${String(i+1).padStart(2,'0')} / ${esc(g.caption)}</span></button>`).join('');
 const count=state.gallery.length;galleryIndex=Math.min(galleryIndex,Math.max(0,count-1));
 $('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=count===0||galleryIndex===count-1;$('#gallery-position').textContent=count?`${galleryIndex+1} / ${count}`:'0 / 0';
 $('#gallery-grid').scrollTo({left:galleryIndex*$('#gallery-grid').clientWidth,behavior:'auto'});
 applyImageFallbacks();
}
function textField(label,section,key,rows=0){const value=state[section][key];const control=rows?`<textarea data-section="${section}" data-field="${key}">${esc(value)}</textarea>`:`<input data-section="${section}" data-field="${key}" value="${esc(value)}">`;return `<label class="field">${label}${control}</label>`}
function editPanel(title,body){return `<div class="edit-panel"><h3>${title}</h3>${body}</div>`}
function statsEditor(){return editPanel('Quick facts',state.stats.map((s,i)=>`<div class="columns-2"><label class="field">Statistic ${i+1}<input data-stat="${i}" data-part="value" value="${esc(s.value)}"></label><label class="field">Label<input data-stat="${i}" data-part="label" value="${esc(s.label.replace(/\n/g,' '))}"></label></div>`).join(''))}
function mediaRow(key,title,url){return `<div class="media-edit"><img class="${key==='logo'?'logo-preview':''}" src="${esc(url)}" alt="${esc(title)}"><div><h3>${esc(title)}</h3><p>Upload a JPEG, PNG or WebP. Your image will be resized and published securely.</p><input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${key}"><button class="admin-secondary" data-media-reset="${key}">Restore original</button></div></div>`}
function programRow(p,i){return `<div class="item-row" data-program="${esc(p.id)}"><div class="item-row-top"><b>Program ${i+1}</b><button class="admin-danger" data-delete-program="${esc(p.id)}">Remove</button></div><label class="field">Title (line breaks allowed)<textarea data-program-id="${esc(p.id)}" data-program-field="title">${esc(p.title)}</textarea></label><label class="field">Short category<input data-program-id="${esc(p.id)}" data-program-field="subtitle" value="${esc(p.subtitle||'')}"></label><label class="field">Description<textarea data-program-id="${esc(p.id)}" data-program-field="description">${esc(p.description)}</textarea></label><label class="field">Type<select data-program-id="${esc(p.id)}" data-program-field="type"><option value="Competitive" ${p.type!=='Non-competitive'?'selected':''}>Competitive</option><option value="Non-competitive" ${p.type==='Non-competitive'?'selected':''}>Non-competitive</option></select></label><label class="field">Training groups (one per line)<textarea data-program-id="${esc(p.id)}" data-program-field="groups">${esc((p.groups||[]).join('\n'))}</textarea></label><div class="media-edit"><img src="${esc(p.image||'')}" alt="${esc(p.title.replace(/\n/g,' '))} program photo"><div><label class="field">Program photo<input type="file" accept="image/png,image/jpeg,image/webp" data-program-upload="${esc(p.id)}"></label><button class="admin-secondary" data-reset-program-photo="${esc(p.id)}">Restore original photo</button></div></div></div>`}
function galleryRow(g,i){return `<div class="item-row" data-gallery="${esc(g.id)}"><div class="item-row-top"><b>Image ${i+1}</b><button class="admin-danger" data-delete-gallery="${esc(g.id)}">Remove</button></div><div class="media-edit"><img src="${esc(g.image)}" alt="Gallery image"><div><label class="field">Caption<input data-gallery-id="${esc(g.id)}" data-gallery-field="caption" value="${esc(g.caption)}"></label><label class="field">Replace photo<input type="file" accept="image/png,image/jpeg,image/webp" data-gallery-upload="${esc(g.id)}"></label></div></div></div>`}
function inquiryRow(q){return `<div class="item-row"><div class="item-row-top"><b>${esc(q.name)}</b><button class="admin-danger" data-delete-inquiry="${esc(q.id)}">Delete</button></div><p>${esc(new Date(q.created_at).toLocaleString())} · <a href="mailto:${esc(q.email)}">${esc(q.email)}</a> · ${esc(q.event||'No event specified')}</p><p style="white-space:pre-wrap">${esc(q.message)}</p></div>`}
async function refreshInquiries(){
 if(!adminAuthorized)return;
 try{inbox=await requireBackend().listInquiries();inboxError='';}
 catch(e){inboxError=e.message||'Could not load inquiries.';}
 if(tab==='inquiries'||tab==='overview')adminRender();
}
const titles={overview:'Overview',content:'Page content',media:'Images & logo',programs:'Coaching programs',gallery:'Photo gallery',inquiries:'Athlete inquiries',settings:'Settings & backup'};
function adminRender(){const panel=$('#admin-panel');$('#tab-title').textContent=titles[tab];$$('.admin-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#inquiry-count-side').textContent=inbox.length||'';
 if(tab==='overview'){panel.innerHTML=`<p class="admin-description">Manage Sean's website content. Changes are securely saved to the published website.</p><div class="admin-grid"><div class="admin-card"><div class="card-label">ACTIVE PROGRAMS</div><div class="big">${state.programs.length}</div><div class="card-label">Published programs</div></div><div class="admin-card"><div class="card-label">GALLERY IMAGES</div><div class="big">${state.gallery.length}</div><div class="card-label">Published photographs</div></div><div class="admin-card"><div class="card-label">REACH OUT INQUIRIES</div><div class="big">${state.inquiries.length}</div><div class="card-label">Stored in the admin inbox</div></div></div><div class="edit-panel"><h3>Homepage preview</h3><div class="admin-preview"><img src="${esc(state.media.hero)}" alt="Homepage image"><div class="overlay"><small>SE ALBERTA TRACK & FIELD</small><h3>${nl(state.hero.headline)}</h3></div></div><div class="editor-actions"><button class="admin-primary" data-jump="content">EDIT HEADLINE ↗</button><button class="admin-secondary" data-jump="media">CHANGE PHOTO</button></div></div><div class="notice">Sign-in is required for editing. Published changes are shared with all visitors. Do not upload photos without permission.</div>`}
 if(tab==='content'){panel.innerHTML=`<p class="admin-description">Edit the words visitors see on the homepage. Changes save automatically.</p>${editPanel('Homepage hero',textField('Main headline (one line per row)','hero','headline',1)+textField('Introduction','hero','description',1))}${editPanel('Coach story',textField('Section heading','about','heading',1)+textField('Coach biography','about','text',1)+textField('Quote','about','quote'))}${statsEditor()}<div class="notice">Changes save automatically. Select “View website” to review them.</div>`}
 if(tab==='media'){panel.innerHTML=`<p class="admin-description">Replace photography and the official Bulldogs crest. Image changes publish to the website.</p>${editPanel('Brand identity',mediaRow('logo','Club logo',state.brand.logo))}${editPanel('Website photos',mediaRow('hero','Homepage hero image',state.media.hero)+mediaRow('studio','Coach studio portrait',state.media.studio)+mediaRow('team','Team photo (gallery default)',state.media.team))}<div class="notice">Images are optimized before uploading to Bulldogs-only Supabase Storage. All changes require an authorized admin account.</div>`}
 if(tab==='programs'){panel.innerHTML=`<p class="admin-description">Add, update or remove coaching programs. Replace each program photo directly here. Changes appear on this device immediately.</p><div class="item-list">${state.programs.map(programRow).join('')}</div><div class="editor-actions"><button class="admin-primary green" id="add-program">+ ADD PROGRAM</button></div>`}
 if(tab==='gallery'){panel.innerHTML=`<p class="admin-description">Add or replace gallery photos and edit captions. Changes publish to the website for all visitors.</p><div class="item-list">${state.gallery.map(galleryRow).join('')}</div><div class="editor-actions"><button class="admin-primary green" id="add-gallery">+ ADD PHOTO</button></div>`}
 if(tab==='inquiries'){panel.innerHTML=`<div class="notice">Messages submitted through the public Reach Out form appear here. Email alerts can be added later; no notification email is sent yet.</div><div class="editor-actions"><button class="admin-primary" id="refresh-inquiries">REFRESH INBOX</button><button class="admin-secondary" id="export-csv">EXPORT INQUIRIES CSV ↓</button></div>${inboxError?`<p role="alert">${esc(inboxError)}</p>`:''}<div class="item-list" style="margin-top:20px">${inbox.length?inbox.map(inquiryRow).join(''):'<div class="edit-panel"><p>No submitted inquiries yet.</p></div>'}</div>`}
 if(tab==='settings'){panel.innerHTML=`<p class="admin-description">Update club identity, create a backup, or restore a saved backup.</p>${editPanel('Club branding',textField('Club name','brand','name')+textField('Brand subtitle','brand','sub')+textField('Instagram URL','brand','instagram'))}${editPanel('Backups',`<p>Export the current content, images, programs, gallery, and inquiries as a JSON backup. Import it to restore edits in another browser.</p><div class="editor-actions"><button id="export-json" class="admin-primary">DOWNLOAD BACKUP JSON ↓</button><label class="admin-secondary" style="cursor:pointer">IMPORT BACKUP JSON <input type="file" id="import-json" accept="application/json,.json" hidden></label></div>`)}${editPanel('Restore defaults',`<p>This will replace the published site content with its original defaults. Other visitors will see the changes.</p><button id="reset-all" class="admin-danger">RESET ALL DEMO CONTENT</button>`)}<div class="notice">A JSON backup may include embedded photos and private demo inquiries. Keep it somewhere secure.</div>`}
}
function switchView(){const isAdmin=location.hash==='#admin'||location.hash.startsWith('#admin/');$('#public-site').hidden=isAdmin;$('#admin-app').hidden=!isAdmin;if(isAdmin){const requested=location.hash.split('/')[1];if(requested&&titles[requested])tab=requested;refreshAdminAuth()}else{renderSite()}window.scrollTo(0,0)}
function download(name,content,mime='application/json'){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function loadImage(file,callback){if(!file?.type.startsWith('image/')){flash('Please choose an image.');return}if(file.size>15*1024*1024){flash('Image is too large (15 MB maximum).');return}const reader=new FileReader();reader.onerror=()=>flash('Could not read photo');reader.onload=()=>{const img=new Image();img.onerror=()=>flash('Could not load the image');img.onload=()=>{const canvas=document.createElement('canvas');const scale=Math.min(1,1300/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);callback(canvas.toDataURL('image/jpeg',.76))};img.src=reader.result};reader.readAsDataURL(file)}
function setMedia(key,value){const old=key==='logo'?state.brand.logo:state.media[key];if(key==='logo')state.brand.logo=value;else state.media[key]=value;if(!persist()){if(key==='logo')state.brand.logo=old;else state.media[key]=old;return}renderSite();adminRender();flash('Photo uploaded. Publishing...')}
function safeImport(s){return s&&typeof s==='object'&&s.brand&&typeof s.brand.name==='string'&&s.hero&&typeof s.hero.headline==='string'&&s.about&&Array.isArray(s.programs)&&Array.isArray(s.gallery)&&Array.isArray(s.inquiries)&&s.media}
async function manageClick(e){const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;location.hash='#admin/'+tab;adminRender();if(tab==='inquiries')await refreshInquiries();return}
 if(t.dataset.jump){tab=t.dataset.jump;location.hash='#admin/'+tab;adminRender();if(tab==='inquiries')await refreshInquiries();return}
 if(t.dataset.deleteProgram){if(!confirm('Remove this coaching program?'))return;state.programs=state.programs.filter(x=>x.id!==t.dataset.deleteProgram);persist();renderSite();adminRender();return}
 if(t.dataset.deleteGallery){if(!confirm('Remove this gallery photo?'))return;state.gallery=state.gallery.filter(x=>x.id!==t.dataset.deleteGallery);persist();renderSite();adminRender();return}
 if(t.dataset.deleteInquiry!==undefined){if(!confirm('Delete this inquiry permanently?'))return;try{await requireBackend().deleteInquiry(t.dataset.deleteInquiry);await refreshInquiries();flash('Inquiry deleted')}catch(e){flash('Delete failed: '+e.message)}return}
 if(t.id==='refresh-inquiries'){await refreshInquiries();return}
 if(t.dataset.mediaReset){const k=t.dataset.mediaReset;setMedia(k,k==='logo'?initial.brand.logo:initial.media[k]);return}
 if(t.dataset.resetProgramPhoto){const p=state.programs.find(p=>p.id===t.dataset.resetProgramPhoto);const fallback=initial.programs.find(p=>p.id===t.dataset.resetProgramPhoto);if(p&&fallback){p.image=fallback.image;persist();renderSite();adminRender();flash('Original program photo restored')}return}
 if(t.id==='add-program'){state.programs.push({id:'p'+Date.now(),title:'NEW\nPROGRAM',subtitle:'COACHING OPTION',description:'Describe what participants will train for.',image:state.media.team,type:'Competitive',groups:['Junior High','High School','College / Open']});persist();renderSite();adminRender();return}
 if(t.id==='add-gallery'){state.gallery.push({id:'g'+Date.now(),image:state.media.team,caption:'NEW PHOTO'});persist();renderSite();adminRender();return}
 if(t.id==='export-json'){download('bulldogs-content-backup.json',JSON.stringify(state,null,2));return}
 if(t.id==='export-csv'){const rows=[['Name','Email','Event','Message','Date'],...inbox.map(q=>[q.name,q.email,q.event,q.message,q.created_at])];download('bulldogs-local-inquiries.csv',rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv');return}
 if(t.id==='reset-all'){if(confirm('Restore published website content to defaults? This affects all visitors.')){state=structuredClone(initial);persist();renderSite();adminRender();flash('Restored original demo')}}
}
$('#admin-app').addEventListener('click',manageClick);
$('#admin-app').addEventListener('input',e=>{const t=e.target;if(t.dataset.section&&t.dataset.field){setDeep(t.dataset.section,t.dataset.field,t.value)}if(t.dataset.stat!==undefined){state.stats[+t.dataset.stat][t.dataset.part]=t.value;persist();renderSite()}if(t.dataset.programId){const p=state.programs.find(p=>p.id===t.dataset.programId);if(p){p[t.dataset.programField]=t.dataset.programField==='groups'?t.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):t.value;persist();renderSite()}}if(t.dataset.galleryId){const g=state.gallery.find(g=>g.id===t.dataset.galleryId);if(g){g[t.dataset.galleryField]=t.value;persist();renderSite()}}});
$('#admin-app').addEventListener('change',e=>{const t=e.target;if(t.dataset.upload){saveUploadedPhoto(t.files?.[0],v=>setMedia(t.dataset.upload,v))}if(t.dataset.programUpload){const id=t.dataset.programUpload;saveUploadedPhoto(t.files?.[0],v=>{const p=state.programs.find(p=>p.id===id);if(!p)return;const old=p.image;p.image=v;if(!persist()){p.image=old;return}renderSite();adminRender();flash('Program photo uploaded. Publishing...')})}if(t.dataset.galleryUpload){const id=t.dataset.galleryUpload;saveUploadedPhoto(t.files?.[0],v=>{const g=state.gallery.find(g=>g.id===id);if(!g)return;const old=g.image;g.image=v;if(!persist()){g.image=old;return}renderSite();adminRender();flash('Gallery image uploaded. Publishing...')})}if(t.dataset.programField==='type'){const p=state.programs.find(p=>p.id===t.dataset.programId);if(p){p.type=t.value;persist();renderSite();adminRender()}}if(t.id==='import-json'){const f=t.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!safeImport(obj))throw new Error('Invalid format');if(!confirm('Replace your current local content with this backup?'))return;const old=state;state=obj;if(!persist()){state=old;return}renderSite();adminRender();flash('Backup imported')}catch{flash('This is not a valid Bulldogs backup file')}};r.readAsText(f)}});
$('#contact-form').addEventListener('submit',async e=>{
 e.preventDefault();if(formSubmitting)return;
 const form=e.currentTarget, data=new FormData(form), note=$('#form-status'), button=$('#send-inquiry');
 // Honeypot: keep automatic spambots from filling the live inbox.
 if(String(data.get('website')||'').trim()){note.textContent='Thank you for reaching out.';form.reset();return}
 const payload={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),event:String(data.get('event')||'').trim(),message:String(data.get('message')||'').trim()};
 formSubmitting=true;button.disabled=true;note.textContent='Sending your message...';
 try{await requireBackend().submitInquiry(payload);form.reset();note.textContent='Your inquiry was received. Bulldogs will reply using the email you provided.';flash('Inquiry submitted successfully')}
 catch(error){note.textContent='Could not send your message: '+(error.message||'Please retry.');flash('Unable to submit inquiry')}
 finally{formSubmitting=false;button.disabled=false}
});
function setGalleryIndex(next){
 galleryIndex=Math.max(0,Math.min(next,state.gallery.length-1));
 const strip=$('#gallery-grid');strip.scrollTo({left:galleryIndex*strip.clientWidth,behavior:'smooth'});
 $('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=galleryIndex>=state.gallery.length-1;
 $('#gallery-position').textContent=state.gallery.length?`${galleryIndex+1} / ${state.gallery.length}`:'0 / 0';
}
$('#gallery-prev').addEventListener('click',()=>setGalleryIndex(galleryIndex-1));
$('#gallery-next').addEventListener('click',()=>setGalleryIndex(galleryIndex+1));
$('#gallery-grid').addEventListener('scroll',()=>{
 const w=$('#gallery-grid').clientWidth;if(!w)return;
 const next=Math.round($('#gallery-grid').scrollLeft/w);
 if(next!==galleryIndex){galleryIndex=next;$('#gallery-position').textContent=`${galleryIndex+1} / ${state.gallery.length}`;$('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=galleryIndex>=state.gallery.length-1}
},{passive:true});
$('#gallery-grid').addEventListener('click',e=>{const el=e.target.closest('[data-lightbox]');if(!el)return;const g=state.gallery[+el.dataset.lightbox];if(!g)return;$('#lightbox-img').src=g.image;$('#lightbox-img').alt=g.caption;$('#lightbox').hidden=false;$('#close-lightbox').focus()});
function closeLightbox(){$('#lightbox').hidden=true;$('#lightbox-img').removeAttribute('src')}$('#close-lightbox').addEventListener('click',closeLightbox);$('#lightbox').addEventListener('click',e=>{if(e.target===$('#lightbox'))closeLightbox()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()});
$('#mobile-menu').addEventListener('click',()=>{const show=$('#navlinks').classList.toggle('show');$('#mobile-menu').setAttribute('aria-expanded',String(show))});$$('.navlinks a').forEach(a=>a.addEventListener('click',()=>{$('#navlinks').classList.remove('show');$('#mobile-menu').setAttribute('aria-expanded','false')}));
$('#admin-login-form').addEventListener('submit',async e=>{
 e.preventDefault();const f=e.currentTarget;const email=String(new FormData(f).get('email')||'').trim(),password=String(new FormData(f).get('password')||'');
 const msg=$('#auth-message');msg.textContent='Signing in...';
 try{await requireBackend().login(email,password);const authorized=await refreshAdminAuth();msg.textContent=authorized?'Signed in':'This account has not been granted Bulldogs admin access.';if(!authorized)await api.logout();else {f.reset();await loadSiteContent()}}
 catch(error){msg.textContent=error.message||'Unable to sign in'}
});
$('#admin-logout').addEventListener('click',async()=>{await api.logout();adminAuthorized=false;switchView();});
window.addEventListener('hashchange',switchView);
renderSite();switchView();loadSiteContent();
})();
