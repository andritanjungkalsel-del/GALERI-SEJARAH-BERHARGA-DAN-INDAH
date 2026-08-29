const LOGIN_EMAIL="GALERI SEJARAH BERHARGA DAN INDAH";
const LOGIN_PASSWORD="Sejarah123";

const loginPage=document.getElementById("loginPage");
const galleryPage=document.getElementById("galleryPage");
const loginForm=document.getElementById("loginForm");
const errorMessage=document.getElementById("errorMessage");
const loading=document.getElementById("loading");
const photoInput=document.getElementById("photoInput");
const videoInput=document.getElementById("videoInput");
const gallery=document.getElementById("gallery");

const DB_NAME="GaleriSejarahDB";
const DB_VERSION=1;
const STORE="media";

function openDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains(STORE)){
    const store=db.createObjectStore(STORE,{keyPath:"id"});
    store.createIndex("uploadedAt","uploadedAt");
   }
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
}

async function dbAdd(item){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");
  tx.objectStore(STORE).put(item);
  tx.oncomplete=()=>{db.close();resolve()};
  tx.onerror=()=>{db.close();reject(tx.error)};
 });
}

async function dbGetAll(){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readonly");
  const req=tx.objectStore(STORE).getAll();
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
  tx.oncomplete=()=>db.close();
 });
}

async function dbDelete(id){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,"readwrite");
  tx.objectStore(STORE).delete(id);
  tx.oncomplete=()=>{db.close();resolve()};
  tx.onerror=()=>{db.close();reject(tx.error)};
 });
}

document.getElementById("togglePassword").onclick=()=>{
 const p=document.getElementById("password");
 p.type=p.type==="password"?"text":"password";
};

loginForm.addEventListener("submit",e=>{
 e.preventDefault();
 const email=document.getElementById("email").value.trim();
 const password=document.getElementById("password").value;
 if(email===LOGIN_EMAIL && password===LOGIN_PASSWORD){
  errorMessage.style.display="none";
  loading.style.display="flex";
  setTimeout(async()=>{
   loading.style.display="none";
   loginPage.style.display="none";
   galleryPage.style.display="block";
   localStorage.setItem("galeri_logged_in","true");
   await loadGallery();
  },900);
 }else{
  errorMessage.style.display="block";
  document.querySelector(".login-box").animate(
   [{transform:"translateX(0)"},{transform:"translateX(-10px)"},{transform:"translateX(10px)"},{transform:"translateX(0)"}],
   {duration:350}
  );
 }
});

document.getElementById("logoutBtn").onclick=()=>{
 localStorage.removeItem("galeri_logged_in");
 galleryPage.style.display="none";
 loginPage.style.display="flex";
};

window.addEventListener("load",async()=>{
 if(localStorage.getItem("galeri_logged_in")==="true"){
  loginPage.style.display="none";
  galleryPage.style.display="block";
  await loadGallery();
 }
});

photoInput.addEventListener("change",async function(){
 const files=Array.from(this.files);
 await uploadFiles(files,"image");
 this.value="";
 await loadGallery();
});

videoInput.addEventListener("change",async function(){
 const files=Array.from(this.files);
 await uploadFiles(files,"video");
 this.value="";
 await loadGallery();
});

async function uploadFiles(files,type){
 for(const file of files){
  if(type==="image" && !file.type.startsWith("image/")) continue;
  if(type==="video" && !file.type.startsWith("video/")) continue;

  const now=new Date();
  const date=now.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
  const time=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const defaultName=file.name.replace(/\.[^/.]+$/,"").replace(/[_-]/g," ");
  const name=prompt("Masukkan nama/judul "+(type==="video"?"video":"foto")+":",defaultName);

  if(name===null) continue;

  try{
   await dbAdd({
    id:crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random(),
    name:name||defaultName,
    type,
    blob:file,
    date,
    time,
    uploadedAt:now.toISOString()
   });
  }catch(err){
   alert("Gagal menyimpan media. Penyimpanan browser mungkin penuh.");
  }
 }
}

async function loadGallery(){
 const media=await dbGetAll();
 media.sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
 gallery.innerHTML="";

 if(!media.length){
  gallery.innerHTML='<div class="empty"><div class="empty-icon">📷</div><h2>Belum ada kenangan</h2><p>Upload foto atau video pertamamu sekarang.</p></div>';
  return;
 }

 for(const item of media){
  const card=document.createElement("div");
  card.className="photo-card";

  const url=URL.createObjectURL(item.blob);

  if(item.type==="video"){
   card.innerHTML=`
    <div class="video-wrapper">
     <video controls preload="metadata"></video>
     <div class="photo-overlay">
      <div class="photo-name"></div>
      <div class="photo-date">📅 ${item.date}</div>
      <div class="photo-date">🕐 ${item.time}</div>
      <div class="media-type">🎬 Video</div>
     </div>
    </div>
    <div class="card-actions">
     <button class="download-btn">⬇️ Download Video</button>
     <button class="delete-btn">🗑️ Hapus Video</button>
    </div>`;
   card.querySelector("video").src=url;
  }else{
   card.innerHTML=`
    <div class="photo-wrapper">
     <img alt="">
     <div class="photo-overlay">
      <div class="photo-name"></div>
      <div class="photo-date">📅 ${item.date}</div>
      <div class="photo-date">🕐 ${item.time}</div>
      <div class="media-type">📸 Foto</div>
     </div>
    </div>
    <div class="card-actions">
     <button class="download-btn">⬇️ Download Foto</button>
     <button class="delete-btn">🗑️ Hapus Foto</button>
    </div>`;
   card.querySelector("img").src=url;
  }

  card.querySelector(".photo-name").textContent=item.name;
  card.querySelector(".download-btn").onclick=()=>downloadMedia(item);
  card.querySelector(".delete-btn").onclick=async()=>{
   if(!confirm("Yakin ingin menghapus media ini?"))return;
   await dbDelete(item.id);
   URL.revokeObjectURL(url);
   await loadGallery();
  };

  gallery.appendChild(card);
 }
}

function downloadMedia(item){
 const url=URL.createObjectURL(item.blob);
 const a=document.createElement("a");
 a.href=url;
 const safeName=(item.name||"kenangan").replace(/[\\/:*?"<>|]/g,"-").trim();
 const ext=item.type==="video"?getExtension(item.blob.type):"jpg";
 a.download=safeName+"."+ext;
 document.body.appendChild(a);
 a.click();
 a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function getExtension(mime){
 const map={
  "video/mp4":"mp4",
  "video/webm":"webm",
  "video/ogg":"ogv",
  "video/quicktime":"mov",
  "video/x-msvideo":"avi"
 };
 return map[mime] || "mp4";
}
