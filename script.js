const LOGIN_EMAIL="GALERI SEJARAH BERHARGA DAN INDAH";
const LOGIN_PASSWORD="Sejarah123";

const loginPage=document.getElementById("loginPage");
const galleryPage=document.getElementById("galleryPage");
const gallery=document.getElementById("gallery");
const countLabel=document.getElementById("countLabel");
const loading=document.getElementById("loading");

const DB_NAME="GaleriSejarahAndriDB";
const STORE="media";

function openDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:"id"});
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}
async function getAll(){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readonly"),q=tx.objectStore(STORE).getAll();
  q.onsuccess=()=>{db.close();resolve(q.result)};
  q.onerror=()=>{db.close();reject(q.error)};
 });
}
async function put(item){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(item);
  tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
 });
}
async function remove(id){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);
  tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
 });
}

document.getElementById("togglePassword").onclick=()=>{
 const p=document.getElementById("password");
 p.type=p.type==="password"?"text":"password";
};

document.getElementById("loginForm").onsubmit=e=>{
 e.preventDefault();
 const email=document.getElementById("email").value.trim();
 const password=document.getElementById("password").value;
 if(email===LOGIN_EMAIL&&password===LOGIN_PASSWORD){
  document.getElementById("errorMessage").style.display="none";
  loading.style.display="grid";
  setTimeout(()=>{loading.style.display="none";loginPage.style.display="none";galleryPage.style.display="block";localStorage.setItem("andri_login","1");loadGallery()},800);
 }else{
  document.getElementById("errorMessage").style.display="block";
  document.querySelector(".login-card").animate([{transform:"translateX(-8px)"},{transform:"translateX(8px)"},{transform:"translateX(0)"}],{duration:260});
 }
};

document.getElementById("logoutBtn").onclick=()=>{
 localStorage.removeItem("andri_login");
 galleryPage.style.display="none";loginPage.style.display="grid";
};

async function addFiles(files,type){
 for(const file of files){
  if(!file.type.startsWith(type+"/"))continue;
  const now=new Date();
  const defaultName=file.name.replace(/\.[^/.]+$/,"").replace(/[_-]/g," ");
  const name=prompt("Nama/judul "+(type==="video"?"video":"foto")+":",defaultName);
  if(name===null)continue;
  await put({
   id:crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random(),
   name:name||defaultName,type,blob:file,
   date:now.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"}),
   time:now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),
   uploadedAt:now.toISOString()
  });
 }
 await loadGallery();
}

document.getElementById("photoInput").onchange=async e=>{await addFiles([...e.target.files],"image");e.target.value=""};
document.getElementById("videoInput").onchange=async e=>{await addFiles([...e.target.files],"video");e.target.value=""};

async function loadGallery(){
 const items=(await getAll()).sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
 gallery.innerHTML="";
 countLabel.textContent=items.length+" kenangan";
 if(!items.length){
  gallery.innerHTML='<div class="empty"><strong>Belum ada kenangan</strong>Upload foto atau video pertamamu.</div>';
  return;
 }
 for(const item of items){
  const card=document.createElement("article");
  card.className="card";
  const media=document.createElement("div");media.className="media";
  const info=document.createElement("div");info.className="info";
  const name=document.createElement("div");name.className="name";name.textContent=item.name;
  const meta=document.createElement("div");meta.className="meta";meta.textContent=(item.type==="video"?"🎬 Video":"📷 Foto")+"  •  "+item.date+"  •  "+item.time;
  info.append(name,meta);
  const actions=document.createElement("div");actions.className="actions";
  const dl=document.createElement("button");dl.className="download";dl.textContent="⬇ Download";
  const del=document.createElement("button");del.className="delete";del.textContent="Hapus";
  actions.append(dl,del);card.append(media,info,actions);gallery.appendChild(card);
  const url=URL.createObjectURL(item.blob);
  if(item.type==="video"){const v=document.createElement("video");v.controls=true;v.preload="metadata";v.src=url;media.appendChild(v)}
  else{const img=document.createElement("img");img.src=url;img.alt=item.name;media.appendChild(img)}
  dl.onclick=()=>download(item);
  del.onclick=async()=>{if(confirm("Hapus kenangan ini?")){await remove(item.id);URL.revokeObjectURL(url);loadGallery()}};
 }
}

function download(item){
 const url=URL.createObjectURL(item.blob),a=document.createElement("a");
 a.href=url;a.download=(item.name||"kenangan").replace(/[\\/:*?"<>|]/g,"-")+"."+(item.type==="video"?"mp4":"jpg");
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}


// ================= CATATAN BIASA =================
const NOTES_KEY="andri_simple_notes";
let editingNoteId=null;

const galleryTab=document.getElementById("galleryTab");
const notesTab=document.getElementById("notesTab");
const gallerySection=document.getElementById("gallerySection");
const notesSection=document.getElementById("notesSection");
const noteEditor=document.getElementById("noteEditor");
const notesList=document.getElementById("notesList");

galleryTab.onclick=()=>{
 galleryTab.classList.add("active");
 notesTab.classList.remove("active");
 gallerySection.style.display="block";
 notesSection.style.display="none";
};

notesTab.onclick=()=>{
 notesTab.classList.add("active");
 galleryTab.classList.remove("active");
 gallerySection.style.display="none";
 notesSection.style.display="block";
 loadNotes();
};

document.getElementById("newNoteBtn").onclick=()=>{
 editingNoteId=null;
 document.getElementById("noteTitle").value="";
 document.getElementById("noteText").value="";
 noteEditor.style.display="block";
 document.getElementById("noteText").focus();
};

document.getElementById("cancelNoteBtn").onclick=()=>{
 noteEditor.style.display="none";
 editingNoteId=null;
};

document.getElementById("saveNoteBtn").onclick=()=>{
 const title=document.getElementById("noteTitle").value.trim();
 const text=document.getElementById("noteText").value.trim();
 if(!text){
  alert("Tulis isi catatan terlebih dahulu.");
  return;
 }
 const notes=JSON.parse(localStorage.getItem(NOTES_KEY)||"[]");
 const now=new Date();
 const time=now.toLocaleString("id-ID",{
  day:"2-digit",month:"long",year:"numeric",
  hour:"2-digit",minute:"2-digit",second:"2-digit"
 });
 if(editingNoteId){
  const note=notes.find(n=>n.id===editingNoteId);
  if(note){note.title=title;note.text=text;note.updated=time;}
 }else{
  notes.unshift({
   id:Date.now()+"-"+Math.random(),
   title:title||"Catatan Tanpa Judul",
   text,
   created:time,
   updated:time
  });
 }
 localStorage.setItem(NOTES_KEY,JSON.stringify(notes));
 noteEditor.style.display="none";
 editingNoteId=null;
 loadNotes();
};

function loadNotes(){
 const notes=JSON.parse(localStorage.getItem(NOTES_KEY)||"[]");
 notesList.innerHTML="";
 if(!notes.length){
  notesList.innerHTML='<div class="no-notes">📝<br><br>Belum ada catatan.<br>Tulis sesuatu yang ingin kamu simpan.</div>';
  return;
 }
 notes.forEach(note=>{
  const card=document.createElement("article");
  card.className="note-card";
  card.innerHTML=`
   <div class="note-title"></div>
   <div class="note-body"></div>
   <div class="note-time">🕐 ${note.updated||note.created}</div>
   <div class="note-actions">
    <button class="edit-note">✏️ Edit</button>
    <button class="delete-note">🗑️ Hapus</button>
   </div>`;
  card.querySelector(".note-title").textContent=note.title||"Catatan Tanpa Judul";
  card.querySelector(".note-body").textContent=note.text;
  card.querySelector(".edit-note").onclick=()=>editNote(note.id);
  card.querySelector(".delete-note").onclick=()=>deleteNote(note.id);
  notesList.appendChild(card);
 });
}

function editNote(id){
 const notes=JSON.parse(localStorage.getItem(NOTES_KEY)||"[]");
 const note=notes.find(n=>n.id===id);
 if(!note)return;
 editingNoteId=id;
 document.getElementById("noteTitle").value=note.title==="Catatan Tanpa Judul"?"":note.title;
 document.getElementById("noteText").value=note.text;
 noteEditor.style.display="block";
 document.getElementById("noteText").focus();
}

function deleteNote(id){
 if(!confirm("Hapus catatan ini?"))return;
 let notes=JSON.parse(localStorage.getItem(NOTES_KEY)||"[]");
 notes=notes.filter(n=>n.id!==id);
 localStorage.setItem(NOTES_KEY,JSON.stringify(notes));
 loadNotes();
}

function updateClock(){
 document.getElementById("clock").textContent=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
setInterval(updateClock,1000);updateClock();

window.addEventListener("load",()=>{if(localStorage.getItem("andri_login")==="1"){loginPage.style.display="none";galleryPage.style.display="block";loadGallery()}});
