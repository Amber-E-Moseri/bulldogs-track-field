'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');

test('public sections appear in navigable order and have sequential numbers',()=>{
 const expected=[['about','01'],['programs','02'],['results','03'],['gallery','04'],['faq','05'],['contact','06']];
 let previous=-1;
 for(const [id,num] of expected){
  const tag=new RegExp('<section\\b[^>]*\\bid="'+id+'"[^>]*>');
  const match=tag.exec(html);
  assert.ok(match,'Missing section '+id);
  const index=match.index;
  assert.ok(index>previous,'Out-of-order section '+id);
  const sectionLabel=html.slice(index,index+230);
  assert.match(sectionLabel,new RegExp('<span>'+num+' /'));
  previous=index;
 }
});
test('only the consolidated stylesheet is loaded',()=>{
 assert.match(html,/href="style\.css"/);
 assert.doesNotMatch(html,/href="premium\.css"/);
 assert.match(css,/#public-site \.hero/);
 assert.match(css,/#admin-app/);
});
test('visitor-facing copy omits developer notes and generic slogans',()=>{
 for(const phrase of ['awaiting independent result-sheet verification','have not been verified for publication','NO SHORTCUTS.','NO EXCUSES.','THE GRIND.','RESULTS THAT SPEAK','ESTABLISHED IN ALBERTA']){
  assert.ok(!html.includes(phrase), 'Public site still includes '+phrase);
 }
});
