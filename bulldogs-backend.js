/* Bulldogs content backend. Publishable key only; authorization enforced by Supabase RLS. */
(function(){
'use strict';
const url='https://cdbeadjwwmakpsmtyguy.supabase.co';
const key='sb_publishable_VMFCvANItK4nwdNE__4fFw_Fq6VPJu-';
const sdk=window.supabase;
if(!sdk?.createClient){window.BulldogsAPI={error:'Supabase library could not load'};return;}
const client=sdk.createClient(url,key,{auth:{storageKey:'bulldogs-auth-v1',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
const unwrap=({data,error})=>{if(error)throw error;return data};
async function session(){return unwrap(await client.auth.getSession()).session}
async function currentAdmin(){
 const s=await session();if(!s?.user?.id)return false;
 const {data,error}=await client.from('bulldogs_admins').select('user_id').eq('user_id',s.user.id).maybeSingle();
 if(error)throw error;return !!data;
}
async function getContent(){
 const {data,error}=await client.from('bulldogs_content').select('content').eq('id','main').single();
 if(error)throw error;return data?.content||{};
}
async function saveContent(content){
 if(!(await currentAdmin()))throw Error('This account is not authorized for Bulldogs.');
 const {data,error}=await client.from('bulldogs_content').update({content,updated_at:new Date().toISOString()}).eq('id','main').select('id').single();
 if(error)throw error;if(!data)throw Error('Content update was not saved.');
 return true;
}
async function uploadPhoto(blob){
 if(!(await currentAdmin()))throw Error('Only Bulldogs admins may upload photos.');
 if(!blob || blob.size>10*1024*1024)throw Error('Photo must be smaller than 10MB.');
 const file='site/'+crypto.randomUUID()+'.webp';
 const {error}=await client.storage.from('bulldogs-media').upload(file,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'});
 if(error)throw error;
 return client.storage.from('bulldogs-media').getPublicUrl(file).data.publicUrl;
}
window.BulldogsAPI={
 client,session,currentAdmin,getContent,saveContent,uploadPhoto,
 login:async(email,password)=>unwrap(await client.auth.signInWithPassword({email,password})),
 logout:async()=>unwrap(await client.auth.signOut())
};
})();
