'use strict';
const $=id=>document.getElementById(id);
let products=[],editingId=null,imageUrl='';
async function api(url,options={}){const r=await fetch(url,{credentials:'same-origin',...options});let data;try{data=await r.json();}catch{data={};}if(!r.ok)throw new Error(data.error||'요청에 실패했습니다.');return data;}
const json=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function state(auth){$('loginView').classList.toggle('hidden',auth);$('dashboard').classList.toggle('hidden',!auth);}
function message(id,text){$(id).textContent=text;}
async function startup(){try{const me=await api('/api/admin/me');state(me.loggedIn);if(me.loggedIn)await reload();}catch{state(false);}}
$('loginForm').addEventListener('submit',async ev=>{ev.preventDefault();message('loginStatus','');try{await api('/api/admin/login',json('POST',{password:$('password').value}));$('password').value='';state(true);await reload();}catch(e){message('loginStatus',e.message);}});
$('logoutBtn').addEventListener('click',async()=>{await api('/api/admin/logout',{method:'POST'});state(false);});
$('refreshBtn').addEventListener('click',reload);
async function reload(){try{products=await api('/api/admin/products');render();message('listStatus','');}catch(e){message('listStatus',e.message);}}
function make(tag,cls,content){const e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e;}
function render(){const list=$('adminList');list.replaceChildren();if(!products.length){list.append(make('p','subtle','등록된 상품이 없습니다.'));return;}
products.forEach((p,i)=>{const row=make('div','admin-item');const thumb=p.image?make('img','admin-thumb'):make('div','admin-thumb');if(p.image){thumb.src=p.image;thumb.alt='';}const info=make('div','admin-item-info');info.append(make('strong','',p.name),make('small','',`${p.price.toLocaleString('ko-KR')}원 · ${p.visible?'공개':'비공개'}`));const controls=make('div','mini-actions');
const actions=[['↑',async()=>move(i,-1)],['↓',async()=>move(i,1)],['수정',()=>edit(p)],['삭제',()=>remove(p)]];
for(const [label,fn] of actions){const button=make('button','mini',label);button.type='button';button.disabled=(label==='↑'&&i===0)||(label==='↓'&&i===products.length-1);button.addEventListener('click',fn);controls.append(button);}row.append(thumb,info,controls);list.append(row);});}
async function move(i,offset){const ids=products.map(p=>p.id);[ids[i],ids[i+offset]]=[ids[i+offset],ids[i]];try{await api('/api/admin/order',json('PUT',{ids}));await reload();}catch(e){message('listStatus',e.message);}}
function edit(p){editingId=p.id;imageUrl=p.image;$('name').value=p.name;$('price').value=p.price;$('description').value=p.description;$('coupang_url').value=p.coupang_url;$('visible').checked=!!p.visible;$('imageFile').value='';preview();$('formTitle').textContent='상품 수정';$('saveBtn').textContent='수정 내용 저장';$('cancelBtn').classList.remove('hidden');message('formStatus','');window.scrollTo({top:0,behavior:'smooth'});}
function preview(){if(imageUrl){$('imagePreview').src=imageUrl;$('imagePreview').classList.remove('hidden');}else{$('imagePreview').removeAttribute('src');$('imagePreview').classList.add('hidden');}}
function reset(){editingId=null;imageUrl='';$('productForm').reset();preview();$('formTitle').textContent='새 상품 등록';$('saveBtn').textContent='상품 저장';$('cancelBtn').classList.add('hidden');message('formStatus','');}
$('cancelBtn').addEventListener('click',reset);
$('imageFile').addEventListener('change',()=>{const file=$('imageFile').files[0];if(file){const temporary=URL.createObjectURL(file);$('imagePreview').src=temporary;$('imagePreview').classList.remove('hidden');$('imagePreview').onload=()=>URL.revokeObjectURL(temporary);}else preview();});
$('productForm').addEventListener('submit',async ev=>{ev.preventDefault();const save=$('saveBtn');save.disabled=true;message('formStatus','저장 중...');try{const file=$('imageFile').files[0];let img=imageUrl;if(file){const form=new FormData();form.append('image',file);const result=await api('/api/admin/upload',{method:'POST',body:form});img=result.url;}const data={name:$('name').value,description:$('description').value,price:Number($('price').value),coupang_url:$('coupang_url').value,image:img,visible:$('visible').checked};await api(editingId?'/api/admin/products/'+editingId:'/api/admin/products',json(editingId?'PUT':'POST',data));reset();message('formStatus','저장되었습니다.');await reload();}catch(e){message('formStatus',e.message);}finally{save.disabled=false;}});
async function remove(p){if(!confirm(`'${p.name}' 상품을 정말 삭제할까요?`))return;try{await api('/api/admin/products/'+p.id,{method:'DELETE'});if(editingId===p.id)reset();await reload();}catch(e){message('listStatus',e.message);}}
startup();
