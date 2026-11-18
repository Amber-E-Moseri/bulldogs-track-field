/* Bulldogs Track & Field: secure Supabase-backed content studio. */
(()=>{'use strict';
const STORAGE='bulldogs_studio_v3';
const initial={brand:{name:'BULLDOGS',sub:'TRACK & FIELD CLUB',logo:'https://raw.githubusercontent.com/Amber-E-Moseri/bulldogs-track-field/main/assets/logo-transparent.webp',instagram:'https://www.instagram.com/bulldogs.trackandfield/'},hero:{headline:'BUILT FOR\nTHE NEXT\nLEVEL.',description:'Cross country, sprint training and open training for athletes who want to improve their running and fitness.'},about:{heading:'A COACH WHO\nSEES YOUR\nPOTENTIAL.',text:'Sean Freeman has coached track and field since 2005 and leads the Medicine Hat Bulldogs, a high-performance track and field club. A former Medicine Hat College men’s soccer player and competitive masters athlete in sprints and multi-events, he joined the Rattlers as an indoor-track co-coach in January 2024. Athletics Alberta recognized his Bulldogs coaching work with its 2018 Junior Development Coach of the Year award, presented in June 2019. He also served as a 2019 Team Alberta head coach. Today, he coaches cross country, sprints and open training in Medicine Hat.',quote:'Dare to be different. — Coach Sean Freeman'},media:{hero:'assets/coach-alumni.webp',studio:'assets/coach-finn-medal.webp',team:'assets/championship-podium.webp'},stats:[{value:'2005',label:'TRACK & FIELD\nCOACHING SINCE'},{value:'2018',label:'JUNIOR DEVELOPMENT COACH\n2018 AWARD · PRESENTED 2019'},{value:'2019',label:'TEAM ALBERTA\nHEAD COACH'}],programs:[{id:'p1',title:'CROSS\nCOUNTRY',subtitle:'DISTANCE RUNNING',description:'Distance running with opportunities to train and compete in cross-country meets.',image:'assets/coach-finn-medal.webp',type:'Competitive',groups:['Junior High','High School','College / Open']},{id:'p2',title:'SPRINTS',subtitle:'SPEED & TECHNIQUE',description:'Sprint training focused on speed, technique, acceleration and race performance.',image:'assets/sprints-track.webp',type:'Competitive',groups:['Junior High','High School','College / Open']},{id:'p3',title:'OPEN\nTRAINING',subtitle:'RUNNING & FITNESS',description:'Structured training for people who want to improve their running, fitness and athletic ability without competing.',image:'assets/open-training.webp',type:'Non-competitive',groups:['Junior High','High School','Adult / Open']}],gallery:[{id:'g1',image:'assets/coach-alumni.webp',caption:'SEAN WITH FORMER ATHLETES'},{id:'g2',image:'assets/sprints-track.webp',caption:'SPRINT TRAINING'},{id:'g3',image:'assets/open-training.webp',caption:'ON THE TRACK'},{id:'g4',image:'assets/sprints-action.webp',caption:'TRAINING SESSION'},{id:'g5',image:'assets/championship-podium.webp',caption:'ALBERTA INDOOR CHAMPIONSHIPS'},{id:'g6',image:'assets/coach-finn-medal.webp',caption:'CROSS-COUNTRY MEDAL'},{id:'g7',image:'assets/high-jump.webp',caption:'HIGH JUMP IN ACTION'}],faq:[{"id":"faq1","question":"Does my athlete need experience?","answer":"Ask Sean which training group suits the athlete's current experience and goals."},{"id":"faq2","question":"What should they bring?","answer":"Running shoes, training clothes and water are a good start. Ask about event-specific gear."},{"id":"faq3","question":"What happens in bad weather?","answer":"Confirm the group-specific indoor, rescheduling or cancellation plan."},{"id":"faq4","question":"How are athletes grouped?","answer":"Junior High, High School, College / Open or Adult / Open, depending on the program. Confirm the exact grade and age requirements."},{"id":"faq5","question":"Who coaches, and what are the credentials?","answer":"Sean has coached since 2005 and has provincial recognition. Confirm current credentials, safeguarding and screening directly with the club."},{"id":"faq6","question":"What are the fees?","answer":"Prices appear above once Sean enters them. A $ placeholder means not yet published. Ask what is included, and about meet fees and gear."},{"id":"faq7","question":"Can my athlete try a session first?","answer":"Ask about trial or drop-in availability and associated fees. A free trial is not guaranteed."},{"id":"faq8","question":"Is financial assistance available?","answer":"Check eligibility for KidSport Medicine Hat & Redcliff. Club participation or assistance is not guaranteed."},{"id":"faq9","question":"What is the refund policy?","answer":"Request current cancellation, refund and missed-session terms in writing."},{"id":"faq10","question":"When is the next intake?","answer":"Sean will confirm upcoming registration dates, training times and waitlist availability."}],inquiries:[]};
let state=structuredClone(initial);
let adminAuthorized=false, syncTimer=null, saveQueue=Promise.resolve(), loadCompleted=false;
let inbox=[], inboxError='', galleryIndex=0, formSubmitting=false;
const api=window.BulldogsAPI;
function setSaveStatus(value){const el=document.querySelector('#save-state');if(el)el.textContent=value}
function requireBackend(){if(!api?.client)throw Error(api?.error||'Unable to connect to the content server.');return api}
function persist(){
 if(!adminAuthorized){flash('Please sign in before making changes.');return false}
 if(!loadCompleted){flash('Website content has not loaded. Changes were not saved; refresh and try again.');setSaveStatus('Not saved');return false}
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
   clean.faq=Array.isArray(content.faq)?content.faq:initial.faq;
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
function priceLabel(p){const amount=String(p.price||'').trim();return amount?'$'+amount+' / '+(p.feeUnit||'season'):'$';}
function renderPricing(){
 const grid=$('#pricing-grid');if(!grid)return;
 const prices=state.programs.filter(p=>p.price!==undefined&&p.price!==null&&String(p.price).trim()!==''&&Number.isFinite(Number(p.price)));
 const wrapper=grid.closest('.pricing-panel');
 if(wrapper)wrapper.hidden=prices.length===0;
 grid.innerHTML=prices.map(p=>`<article class="pricing-item"><h4>${esc(p.title.replace(/\n/g,' '))}</h4><strong>${esc(priceLabel(p))}</strong><small>Starting fee · confirm what's included with Sean</small></article>`).join('');
}
function publicGalleryItems(){
 const featured=new Set([state.media.hero,state.media.studio,...state.programs.slice(1).map(p=>p.image)].filter(Boolean));
 return state.gallery.map((item,originalIndex)=>({...item,originalIndex})).filter(item=>!featured.has(item.image));
}
function renderSite(){
 $('#hero-headline').innerHTML=htmlTitle(state.hero.headline);$('#hero-description').textContent=state.hero.description;
 $('#about-heading').innerHTML=htmlTitle(state.about.heading);$('#about-text').textContent=state.about.text;$('#coach-quote').textContent='“'+state.about.quote+'”';
 $$('.brand span').forEach(el=>{el.innerHTML=esc(state.brand.name)+'<small>'+esc(state.brand.sub)+'</small>'});
 $$('[data-media]').forEach(el=>{const key=el.dataset.media;el.src=key==='logo'?state.brand.logo:state.media[key]});
 const crest=String(state.brand.logo||'');
 if(/^(https:\/\/[^"'\\<>]+|assets\/[A-Za-z0-9._/-]+)$/.test(crest)){
  $('#public-site').style.setProperty('--bulldogs-crest','url("'+crest+'")');
 }
 $('#instagram-link').href=/^https:\/\//.test(state.brand.instagram)?state.brand.instagram:'https://www.instagram.com/bulldogs.trackandfield/';
 $('#stat-row').innerHTML=state.stats.map(s=>`<div><strong>${esc(s.value)}</strong><span>${nl(s.label)}</span></div>`).join('');
 $('#program-grid').innerHTML=state.programs.map((p,i)=>`<article class="program-card"><span class="number">${String(i+1).padStart(2,'0')} / ${i===0?'DISTANCE':'TRAINING'}</span><span class="program-type ${p.type==='Non-competitive'?'noncompetitive':''}">${esc(p.type||'Competitive')}</span><h3>${nl(p.title)}</h3>${i===0?'':`<div class="program-photo"><img loading="lazy" src="${esc(p.image||'')}" alt="${esc(p.title.replace(/\n/g,' '))} training photograph"></div>`}<p>${esc(p.description)}</p><div class="training-groups"><strong>TRAINING GROUPS</strong><ul>${(Array.isArray(p.groups)?p.groups:[]).map(group=>`<li>${esc(group)}</li>`).join('')}</ul></div><button class="program-ask" type="button" data-ask-program="${esc(p.title.replace(/\n/g,' '))}">Ask about this program</button><div class="card-bottom"><span>${esc(p.subtitle||'ATHLETE DEVELOPMENT')}</span></div></article>`).join('');
 renderPricing();
 const faqGrid=$('#faq-grid');if(faqGrid)faqGrid.innerHTML=(Array.isArray(state.faq)?state.faq:[]).filter(item=>item&&String(item.question||'').trim()).map(item=>`<details><summary>${esc(item.question)}</summary><p>${esc(item.answer||'')}</p></details>`).join('');
 const galleryItems=publicGalleryItems();
 const galleryNotice=$('#gallery-empty');if(galleryNotice)galleryNotice.hidden=galleryItems.length>0;
 $('#gallery-grid').innerHTML=galleryItems.map((g,i)=>`<button class="gallery-tile" data-lightbox="${g.originalIndex}" aria-label="View ${esc(g.caption)}" tabindex="${i===galleryIndex?'0':'-1'}"><img loading="lazy" src="${esc(g.image)}" alt="${esc(g.caption)}"><span class="caption">${String(i+1).padStart(2,'0')} / ${esc(g.caption)}</span></button>`).join('');
 const count=galleryItems.length;galleryIndex=Math.min(galleryIndex,Math.max(0,count-1));
 $('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=count===0||galleryIndex===count-1;$('#gallery-position').textContent=count?`${galleryIndex+1} / ${count}`:'0 / 0';
 const galleryStrip=$('#gallery-grid'),galleryTiles=galleryStrip.querySelectorAll('.gallery-tile');
 if(galleryTiles.length)galleryStrip.scrollTo({left:galleryTiles[galleryIndex].offsetLeft-galleryTiles[0].offsetLeft,behavior:'auto'});
 applyImageFallbacks();
}
function textField(label,section,key,rows=0){const value=state[section][key];const control=rows?`<textarea data-section="${section}" data-field="${key}">${esc(value)}</textarea>`:`<input data-section="${section}" data-field="${key}" value="${esc(value)}">`;return `<label class="field">${label}${control}</label>`}
function editPanel(title,body){return `<div class="edit-panel"><h3>${title}</h3>${body}</div>`}
function statsEditor(){return editPanel('Quick facts',state.stats.map((s,i)=>`<div class="columns-2"><label class="field">Statistic ${i+1}<input data-stat="${i}" data-part="value" value="${esc(s.value)}"></label><label class="field">Label<input data-stat="${i}" data-part="label" value="${esc(s.label.replace(/\n/g,' '))}"></label></div>`).join(''))}
function mediaRow(key,title,url){return `<div class="media-edit"><img class="${key==='logo'?'logo-preview':''}" src="${esc(url)}" alt="${esc(title)}"><div><h3>${esc(title)}</h3><p>Upload a JPEG, PNG or WebP. Your image will be resized and published securely.</p><input type="file" accept="image/png,image/jpeg,image/webp" data-upload="${key}"><button class="admin-secondary" data-media-reset="${key}">Restore original</button></div></div>`}
function programRow(p,i){return `<div class="item-row" data-program="${esc(p.id)}"><div class="item-row-top"><b>Program ${i+1}</b><button class="admin-danger" data-delete-program="${esc(p.id)}">Remove</button></div><label class="field">Title (line breaks allowed)<textarea data-program-id="${esc(p.id)}" data-program-field="title">${esc(p.title)}</textarea></label><label class="field">Short category<input data-program-id="${esc(p.id)}" data-program-field="subtitle" value="${esc(p.subtitle||'')}"></label><label class="field">Description<textarea data-program-id="${esc(p.id)}" data-program-field="description">${esc(p.description)}</textarea></label><label class="field">Type<select data-program-id="${esc(p.id)}" data-program-field="type"><option value="Competitive" ${p.type!=='Non-competitive'?'selected':''}>Competitive</option><option value="Non-competitive" ${p.type==='Non-competitive'?'selected':''}>Non-competitive</option></select></label><label class="field">Days and times<input data-program-id="${esc(p.id)}" data-program-field="schedule" placeholder="To be confirmed" value="${esc(p.schedule||'')}"></label><label class="field">Venue<input data-program-id="${esc(p.id)}" data-program-field="venue" placeholder="To be confirmed" value="${esc(p.venue||'')}"></label><label class="field">Season<input data-program-id="${esc(p.id)}" data-program-field="season" placeholder="To be confirmed" value="${esc(p.season||'')}"></label><label class="field">Next start date<input data-program-id="${esc(p.id)}" data-program-field="nextStart" placeholder="To be confirmed" value="${esc(p.nextStart||'')}"></label><label class="field">Starting price in dollars (leave empty for $)<input type="number" min="0" step="0.01" placeholder="$" data-program-id="${esc(p.id)}" data-program-field="price" value="${esc(p.price||'')}"></label><label class="field">Pricing unit<select data-program-id="${esc(p.id)}" data-program-field="feeUnit"><option value="season" ${p.feeUnit!=='session'?'selected':''}>Per season</option><option value="session" ${p.feeUnit==='session'?'selected':''}>Per session</option></select></label><label class="field">Training groups (one per line)<textarea data-program-id="${esc(p.id)}" data-program-field="groups">${esc((p.groups||[]).join('\n'))}</textarea></label><div class="media-edit"><img src="${esc(p.image||'')}" alt="${esc(p.title.replace(/\n/g,' '))} program photo"><div><label class="field">Program photo<input type="file" accept="image/png,image/jpeg,image/webp" data-program-upload="${esc(p.id)}"></label><button class="admin-secondary" data-reset-program-photo="${esc(p.id)}">Restore original photo</button></div></div></div>`}
function faqRow(item,i){return `<div class="item-row"><div class="item-row-top"><b>Question ${i+1}</b><button type="button" class="admin-danger" data-delete-faq="${esc(item.id)}">Remove</button></div><label class="field">Question<input maxlength="200" data-faq-id="${esc(item.id)}" data-faq-field="question" value="${esc(item.question)}"></label><label class="field">Answer<textarea maxlength="2000" rows="3" data-faq-id="${esc(item.id)}" data-faq-field="answer">${esc(item.answer)}</textarea></label></div>`;}
function galleryRow(g,i){return `<div class="item-row" data-gallery="${esc(g.id)}"><div class="item-row-top"><b>Image ${i+1}</b><button class="admin-danger" data-delete-gallery="${esc(g.id)}">Remove</button></div><div class="media-edit"><img src="${esc(g.image)}" alt="Gallery image"><div><label class="field">Caption<input data-gallery-id="${esc(g.id)}" data-gallery-field="caption" value="${esc(g.caption)}"></label><label class="field">Replace photo<input type="file" accept="image/png,image/jpeg,image/webp" data-gallery-upload="${esc(g.id)}"></label></div></div></div>`}
function inquiryRow(q){
 const lines=String(q.message||'').replace(/\\n/g,'\n').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const details=lines.filter(line=>!/^(Program|Group|Displayed price):/i.test(line));
 const safeEmail=String(q.email||'').trim();
 return `<article class="item-row inquiry-card"><div class="item-row-top"><div><b>${esc(q.name)}</b><p class="inquiry-date">${esc(new Date(q.created_at).toLocaleString())}</p></div><button class="admin-danger" data-delete-inquiry="${esc(q.id)}">Delete</button></div><div class="inquiry-meta"><a href="mailto:${esc(safeEmail)}">${esc(safeEmail)}</a><span>${esc(q.event||'General inquiry')}</span></div>${details.length?`<div class="inquiry-details">${details.map(line=>`<p>${esc(line)}</p>`).join('')}</div>`:''}</article>`;
}
async function refreshInquiries(){
 if(!adminAuthorized)return;
 try{inbox=await requireBackend().listInquiries();inboxError='';}
 catch(e){inboxError=e.message||'Could not load inquiries.';}
 if(tab==='inquiries'||tab==='overview')adminRender();
}
const titles={overview:'Overview',content:'Page content',media:'Images & logo',programs:'Coaching programs',gallery:'Photo gallery',faq:'Frequently asked questions',inquiries:'Athlete inquiries',settings:'Settings & backup'};
function adminRender(){const panel=$('#admin-panel');$('#tab-title').textContent=titles[tab];$$('.admin-nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#inquiry-count-side').textContent=inbox.length||'';
 if(tab==='overview'){panel.innerHTML=`<p class="admin-description">Manage Sean's website content. Changes are securely saved to the published website.</p><div class="admin-grid"><div class="admin-card"><div class="card-label">ACTIVE PROGRAMS</div><div class="big">${state.programs.length}</div><div class="card-label">Published programs</div></div><div class="admin-card"><div class="card-label">GALLERY IMAGES</div><div class="big">${state.gallery.length}</div><div class="card-label">Published photographs</div></div><div class="admin-card"><div class="card-label">REACH OUT INQUIRIES</div><div class="big">${inbox.length}</div><div class="card-label">Stored in the admin inbox</div></div></div><div class="edit-panel"><h3>Homepage preview</h3><div class="admin-preview"><img src="${esc(state.media.hero)}" alt="Homepage image"><div class="overlay"><small>SE ALBERTA TRACK & FIELD</small><h3>${nl(state.hero.headline)}</h3></div></div><div class="editor-actions"><button class="admin-primary" data-jump="content">EDIT HEADLINE</button><button class="admin-secondary" data-jump="media">CHANGE PHOTO</button></div></div><div class="notice">Sign-in is required for editing. Published changes are shared with all visitors. Do not upload photos without permission.</div>`}
 if(tab==='content'){panel.innerHTML=`<p class="admin-description">Edit the words visitors see on the homepage. Changes save automatically.</p>${editPanel('Homepage hero',textField('Main headline (one line per row)','hero','headline',1)+textField('Introduction','hero','description',1))}${editPanel('Coach story',textField('Section heading','about','heading',1)+textField('Coach biography','about','text',1)+textField('Quote','about','quote'))}${statsEditor()}<div class="notice">Changes save automatically. Select “View website” to review them.</div>`}
 if(tab==='media'){panel.innerHTML=`<p class="admin-description">Replace photography and the official Bulldogs crest. Image changes publish to the website.</p>${editPanel('Brand identity',mediaRow('logo','Club logo',state.brand.logo))}${editPanel('Website photos',mediaRow('hero','Homepage hero image',state.media.hero)+mediaRow('studio','Coach studio portrait',state.media.studio)+mediaRow('team','Team photo (gallery default)',state.media.team))}<div class="notice">Images are optimized before uploading to Bulldogs-only Supabase Storage. All changes require an authorized admin account.</div>`}
 if(tab==='programs'){panel.innerHTML=`<p class="admin-description">Add, update or remove coaching programs. Replace each program photo directly here. Changes appear on this device immediately.</p><div class="item-list">${state.programs.map(programRow).join('')}</div><div class="editor-actions"><button class="admin-primary green" id="add-program">+ ADD PROGRAM</button></div>`}
 if(tab==='gallery'){panel.innerHTML=`<p class="admin-description">Add or replace gallery photos and edit captions. Changes publish to the website for all visitors.</p><div class="item-list">${state.gallery.map(galleryRow).join('')}</div><div class="editor-actions"><button class="admin-primary green" id="add-gallery">+ ADD PHOTO</button></div>`}
 if(tab==='faq'){panel.innerHTML=`<p class="admin-description">Edit the questions and answers shown on the public site. Changes publish to Supabase for all visitors.</p><div class="item-list">${(state.faq||[]).map(faqRow).join('')}</div><div class="editor-actions"><button class="admin-primary green" type="button" id="add-faq">+ ADD QUESTION</button></div>`}
 if(tab==='inquiries'){panel.innerHTML=`<div class="notice">Messages submitted through the public Reach Out form appear here. Email alerts can be added later; no notification email is sent yet.</div><div class="editor-actions"><button class="admin-primary" id="refresh-inquiries">REFRESH INBOX</button><button class="admin-secondary" id="export-csv">EXPORT INQUIRIES CSV ↓</button></div>${inboxError?`<p role="alert">${esc(inboxError)}</p>`:''}<div class="item-list" style="margin-top:20px">${inbox.length?inbox.map(inquiryRow).join(''):'<div class="edit-panel"><p>No submitted inquiries yet.</p></div>'}</div>`}
 if(tab==='settings'){panel.innerHTML=`<p class="admin-description">Update club identity, create a backup, or restore a saved backup.</p>${editPanel('Club branding',textField('Club name','brand','name')+textField('Brand subtitle','brand','sub')+textField('Instagram URL','brand','instagram'))}${editPanel('Backups',`<p>Export the current content, images, programs, gallery, and inquiries as a JSON backup. Import it to restore edits in another browser.</p><div class="editor-actions"><button id="export-json" class="admin-primary">DOWNLOAD BACKUP JSON ↓</button><label class="admin-secondary" style="cursor:pointer">IMPORT BACKUP JSON <input type="file" id="import-json" accept="application/json,.json" hidden></label></div>`)}${editPanel('Restore website defaults',`<p>Restore the approved Bulldogs website content and current photo assets, programs, FAQs and branding. The website layout stays unchanged. This replaces your published Admin Studio edits for all visitors. Download a backup first if you want to keep them.</p><button id="reset-all" class="admin-danger" type="button">RESTORE WEBSITE DEFAULTS</button>`)}<div class="notice">A JSON backup may include embedded photos and private demo inquiries. Keep it somewhere secure.</div>`}
}
function switchView(){
 const isAdmin=location.hash==='#admin'||location.hash.startsWith('#admin/');
 $('#public-site').hidden=isAdmin;$('#admin-app').hidden=!isAdmin;
 if(isAdmin){const requested=location.hash.split('/')[1];if(requested&&titles[requested])tab=requested;refreshAdminAuth();window.scrollTo(0,0)}
 else{
  renderSite();
  const section=decodeURIComponent(location.hash.slice(1));
  if(section&&document.getElementById(section)){
   requestAnimationFrame(()=>document.getElementById(section).scrollIntoView({behavior:'smooth',block:'start'}));
  }else if(!section||section==='home')window.scrollTo(0,0);
 }
}
const csvCell=v=>{let t=String(v??'');if(/^[\t\r\n ]*[=+\-@]/.test(t))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'};
function download(name,content,mime='application/json'){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function loadImage(file,callback){if(!['image/jpeg','image/png','image/webp'].includes(file?.type)){flash('Please choose a JPEG, PNG or WebP image.');return}if(file.size>15*1024*1024){flash('Image is too large (15 MB maximum).');return}const reader=new FileReader();reader.onerror=()=>flash('Could not read photo');reader.onload=()=>{const img=new Image();img.onerror=()=>flash('Could not load the image');img.onload=()=>{const canvas=document.createElement('canvas');const scale=Math.min(1,1300/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);callback(canvas.toDataURL('image/webp',.82))};img.src=reader.result};reader.readAsDataURL(file)}
function setMedia(key,value){const old=key==='logo'?state.brand.logo:state.media[key];if(key==='logo')state.brand.logo=value;else state.media[key]=value;if(!persist()){if(key==='logo')state.brand.logo=old;else state.media[key]=old;return}renderSite();adminRender();flash('Photo uploaded. Publishing...')}
function safeImport(s){return s&&typeof s==='object'&&s.brand&&typeof s.brand.name==='string'&&s.hero&&typeof s.hero.headline==='string'&&s.about&&Array.isArray(s.programs)&&Array.isArray(s.gallery)&&Array.isArray(s.inquiries)&&s.media}
async function manageClick(e){const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tab){tab=t.dataset.tab;location.hash='#admin/'+tab;adminRender();if(tab==='inquiries')await refreshInquiries();return}
 if(t.dataset.jump){tab=t.dataset.jump;location.hash='#admin/'+tab;adminRender();if(tab==='inquiries')await refreshInquiries();return}
 if(t.dataset.deleteProgram){if(!confirm('Remove this coaching program?'))return;state.programs=state.programs.filter(x=>x.id!==t.dataset.deleteProgram);persist();renderSite();adminRender();return}
 if(t.dataset.deleteFaq){if(!confirm('Remove this FAQ question?'))return;state.faq=state.faq.filter(q=>q.id!==t.dataset.deleteFaq);persist();renderSite();adminRender();return}
 if(t.dataset.deleteGallery){if(!confirm('Remove this gallery photo?'))return;state.gallery=state.gallery.filter(x=>x.id!==t.dataset.deleteGallery);persist();renderSite();adminRender();return}
 if(t.dataset.deleteInquiry!==undefined){if(!confirm('Delete this inquiry permanently?'))return;try{await requireBackend().deleteInquiry(t.dataset.deleteInquiry);await refreshInquiries();flash('Inquiry deleted')}catch(e){flash('Delete failed: '+e.message)}return}
 if(t.id==='refresh-inquiries'){await refreshInquiries();return}
 if(t.dataset.mediaReset){const k=t.dataset.mediaReset;setMedia(k,k==='logo'?initial.brand.logo:initial.media[k]);return}
 if(t.dataset.resetProgramPhoto){const p=state.programs.find(p=>p.id===t.dataset.resetProgramPhoto);const fallback=initial.programs.find(p=>p.id===t.dataset.resetProgramPhoto);if(p&&fallback){p.image=fallback.image;persist();renderSite();adminRender();flash('Original program photo restored')}return}
 if(t.id==='add-program'){state.programs.push({id:'p'+Date.now(),title:'NEW\nPROGRAM',subtitle:'COACHING OPTION',description:'Describe what participants will train for.',image:state.media.team,type:'Competitive',groups:['Junior High','High School','College / Open']});persist();renderSite();adminRender();return}
 if(t.id==='add-faq'){state.faq=Array.isArray(state.faq)?state.faq:[];state.faq.push({id:'faq'+Date.now(),question:'New question',answer:'Enter the answer here.'});persist();renderSite();adminRender();return}
 if(t.id==='add-gallery'){state.gallery.push({id:'g'+Date.now(),image:state.media.team,caption:'NEW PHOTO'});persist();renderSite();adminRender();return}
 if(t.id==='export-json'){download('bulldogs-content-backup.json',JSON.stringify(state,null,2));return}
 if(t.id==='export-csv'){const rows=[['Name','Email','Event','Message','Date'],...inbox.map(q=>[q.name,q.email,q.event,q.message,q.created_at])];download('bulldogs-local-inquiries.csv',rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv');return}
 if(t.id==='reset-all'){if(!adminAuthorized){flash('Sign in before restoring website defaults.');return}if(!loadCompleted){flash('Website content is still loading. Please try again.');return}if(confirm('Restore the approved Bulldogs website defaults? This replaces all published Admin Studio edits to photos, text, programs, and FAQs for EVERY visitor. The layout will stay the same. Download a JSON backup first if you may want to undo these changes.')){state=structuredClone(initial);if(persist()){renderSite();adminRender();flash('Approved website defaults queued for publishing. Check save status.')}}}
}
$('#program-grid').addEventListener('click',e=>{const button=e.target.closest('[data-ask-program]');if(!button)return;const select=$('#contact-form select[name="program"]');const match=[...select.options].find(o=>o.value.toLowerCase()===button.dataset.askProgram.toLowerCase());if(match)select.value=match.value;location.hash='#join-team';select.focus()});
$('#admin-app').addEventListener('click',manageClick);
$('#admin-app').addEventListener('input',e=>{const t=e.target;if(t.dataset.section&&t.dataset.field){setDeep(t.dataset.section,t.dataset.field,t.value)}if(t.dataset.stat!==undefined){state.stats[+t.dataset.stat][t.dataset.part]=t.value;persist();renderSite()}if(t.dataset.programId){const p=state.programs.find(p=>p.id===t.dataset.programId);if(p){p[t.dataset.programField]=t.dataset.programField==='groups'?t.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):t.value;persist();renderSite()}}if(t.dataset.faqId){const q=(state.faq||[]).find(q=>q.id===t.dataset.faqId);if(q&&['question','answer'].includes(t.dataset.faqField)){q[t.dataset.faqField]=t.value;persist();renderSite()}}if(t.dataset.galleryId){const g=state.gallery.find(g=>g.id===t.dataset.galleryId);if(g){g[t.dataset.galleryField]=t.value;persist();renderSite()}}});
$('#admin-app').addEventListener('change',e=>{const t=e.target;if(t.dataset.upload){saveUploadedPhoto(t.files?.[0],v=>setMedia(t.dataset.upload,v))}if(t.dataset.programUpload){const id=t.dataset.programUpload;saveUploadedPhoto(t.files?.[0],v=>{const p=state.programs.find(p=>p.id===id);if(!p)return;const old=p.image;p.image=v;if(!persist()){p.image=old;return}renderSite();adminRender();flash('Program photo uploaded. Publishing...')})}if(t.dataset.galleryUpload){const id=t.dataset.galleryUpload;saveUploadedPhoto(t.files?.[0],v=>{const g=state.gallery.find(g=>g.id===id);if(!g)return;const old=g.image;g.image=v;if(!persist()){g.image=old;return}renderSite();adminRender();flash('Gallery image uploaded. Publishing...')})}if(t.dataset.programField==='type'){const p=state.programs.find(p=>p.id===t.dataset.programId);if(p){p.type=t.value;persist();renderSite();adminRender()}}if(t.id==='import-json'){const f=t.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(!safeImport(obj))throw new Error('Invalid format');if(!confirm('Replace your current local content with this backup?'))return;const old=state;state=obj;if(!persist()){state=old;return}renderSite();adminRender();flash('Backup imported')}catch{flash('This is not a valid Bulldogs backup file')}};r.readAsText(f)}});
function updateGuardianFields(){
 const required=$('#athlete-minor').checked,fields=$('#guardian-fields');
 fields.hidden=!required;
 fields.querySelectorAll('input').forEach(input=>{input.required=required;input.disabled=!required});
}
$('#athlete-minor').addEventListener('change',updateGuardianFields);
updateGuardianFields();
$('#contact-form').addEventListener('submit',async e=>{
 e.preventDefault();if(formSubmitting)return;
 const form=e.currentTarget, data=new FormData(form), note=$('#form-status'), button=$('#send-inquiry');
 // Honeypot: keep automatic spambots from filling the live inbox.
 if(String(data.get('website')||'').trim()){note.textContent='Thank you for reaching out.';form.reset();return}
 const program=String(data.get('program')||'').trim(), ageGroup=String(data.get('age_group')||'').trim();
 const under18=data.get('under18')==='on', guardianName=String(data.get('guardian_name')||'').trim(),guardianEmail=String(data.get('guardian_email')||'').trim();
 if(!program||!ageGroup){note.textContent='Select a program and training group.';return}
 if((program==='Open Training'&&ageGroup==='College / Open')||(program!=='Open Training'&&ageGroup==='Adult / Open')){note.textContent='Please select a training group offered for your chosen program.';return}
 if(under18&&(!guardianName||!guardianEmail)){note.textContent='Parent or guardian name and email are required for athletes under 18.';return}
 const guardianDetails=under18?'\\nParent/guardian: '+guardianName+' ('+guardianEmail+')':'';
 const intent=String(data.get('intent')||'join').trim(),source=String(data.get('source')||'').trim();
 const selected=state.programs.find(p=>p.title.replace(/\n/g,' ').toLowerCase()===program.toLowerCase());
 const shownPrice=priceLabel(selected||{});
 const payload={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim(),event:program+' / '+ageGroup,message:'Program: '+program+'\\nGroup: '+ageGroup+'\\nInterest: '+intent+'\\nSource: '+source+'\\nUnder 18: '+(under18?'Yes':'No')+guardianDetails+'\\nGoals: '+String(data.get('message')||'').trim()+'\\nDisplayed price: '+shownPrice};
 formSubmitting=true;button.disabled=true;note.textContent='Sending your message...';
 try{await requireBackend().submitInquiry(payload);form.reset();updateGuardianFields();note.textContent='Request received.';flash('Inquiry submitted successfully')}
 catch(error){note.textContent='Could not send your message: '+(error.message||'Please retry.');flash('Unable to submit inquiry')}
 finally{formSubmitting=false;button.disabled=false}
});
function setGalleryIndex(next){
 const count=publicGalleryItems().length;
 galleryIndex=Math.max(0,Math.min(next,count-1));
 const strip=$('#gallery-grid'),tiles=strip.querySelectorAll('.gallery-tile');
 if(tiles.length)strip.scrollTo({left:tiles[galleryIndex].offsetLeft-tiles[0].offsetLeft,behavior:'smooth'});
 $('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=galleryIndex>=count-1;
 $('#gallery-position').textContent=count?`${galleryIndex+1} / ${count}`:'0 / 0';
}
$('#gallery-prev').addEventListener('click',()=>setGalleryIndex(galleryIndex-1));
$('#gallery-next').addEventListener('click',()=>setGalleryIndex(galleryIndex+1));
$('#gallery-grid').addEventListener('scroll',()=>{
 const strip=$('#gallery-grid'),tiles=Array.from(strip.querySelectorAll('.gallery-tile'));if(!tiles.length)return;
 const next=tiles.reduce((best,tile,index)=>Math.abs(tile.offsetLeft-tiles[0].offsetLeft-strip.scrollLeft)<Math.abs(tiles[best].offsetLeft-tiles[0].offsetLeft-strip.scrollLeft)?index:best,0);
 if(next!==galleryIndex){const count=publicGalleryItems().length;galleryIndex=Math.min(next,Math.max(0,count-1));$('#gallery-position').textContent=count?`${galleryIndex+1} / ${count}`:'0 / 0';$('#gallery-prev').disabled=galleryIndex===0;$('#gallery-next').disabled=galleryIndex>=count-1}
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
function initPremiumMotion(){
 const nav=$('#public-site .nav');
 const syncNav=()=>nav?.classList.toggle('is-scrolled',window.scrollY>42);
 window.addEventListener('scroll',syncNav,{passive:true});syncNav();
 if(!('IntersectionObserver' in window))return;
 const reveal=Array.from(document.querySelectorAll('#public-site .section, #public-site .manifesto, #public-site .stats'));
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}
 },{threshold:.08,rootMargin:'0px 0px 50px 0px'});
 reveal.forEach(el=>{el.classList.add('scroll-reveal');observer.observe(el)});
}
renderSite();switchView();loadSiteContent();initPremiumMotion();
})();