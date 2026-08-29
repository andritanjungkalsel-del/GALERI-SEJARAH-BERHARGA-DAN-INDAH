const LOGIN_EMAIL="GALERI SEJARAH BERHARGA DAN INDAH";
const LOGIN_PASSWORD="“Setiap foto menyimpan cerita, setiap kenangan memiliki arti.”\nGaleri Sejarah Berharga dan Indah adalah tempat untuk menyimpan, mengenang, dan mengabadikan berbagai momen berharga dalam perjalanan hidup. Setiap foto bukan hanya sekadar gambar, tetapi menjadi bagian dari cerita, pengalaman, perjuangan, kebahagiaan, dan kenangan yang akan selalu memiliki tempat di hati.";

const loginPage=document.getElementById("loginPage");
const galleryPage=document.getElementById("galleryPage");
const loginForm=document.getElementById("loginForm");
const errorMessage=document.getElementById("errorMessage");
const loading=document.getElementById("loading");
const photoInput=document.getElementById("photoInput");
const gallery=document.getElementById("gallery");

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
   setTimeout(()=>{
     loading.style.display="none";
     loginPage.style.display="none";
     galleryPage.style.display="block";
     localStorage.setItem("galeri_logged_in","true");
     loadGallery();
   },1000);
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

window.addEventListener("load",()=>{
 if(localStorage.getItem("galeri_logged_in")==="true"){
   loginPage.style.display="none";
   galleryPage.style.display="block";
   loadGallery();
 }
});

photoInput.addEventListener("change",async function(){
 const files=Array.from(this.files);
 for(const file of files) await createPhoto(file);
 this.value="";
 loadGallery();
});

function createPhoto(file){
 return new Promise(resolve=>{
  const reader=new FileReader();
  reader.onload=e=>{
   const now=new Date();
   const date=now.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"});
   const time=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
   const defaultName=file.name.replace(/\.[^/.]+$/,"").replace(/[_-]/g," ");
   const name=prompt("Masukkan nama/judul foto:",defaultName);
   if(name===null){resolve();return}
   const photos=JSON.parse(localStorage.getItem("galeri_photos")||"[]");
   photos.unshift({
    id:Date.now()+Math.random(),
    name:name||defaultName,
    image:e.target.result,
    date,
    time
   });
   try{localStorage.setItem("galeri_photos",JSON.stringify(photos))}
   catch(err){alert("Penyimpanan browser penuh. Hapus beberapa foto terlebih dahulu.")}
   resolve();
  };
  reader.readAsDataURL(file);
 });
}

function loadGallery(){
 const photos=JSON.parse(localStorage.getItem("galeri_photos")||"[]");
 gallery.innerHTML="";
 if(!photos.length){
  gallery.innerHTML='<div class="empty"><div class="empty-icon">📷</div><h2>Belum ada kenangan</h2><p>Upload foto pertamamu sekarang.</p></div>';
  return;
 }
 photos.forEach(photo=>{
  const card=document.createElement("div");
  card.className="photo-card";
  card.innerHTML=`
   <div class="photo-wrapper">
    <img src="${photo.image}" alt="">
    <div class="photo-overlay">
     <div class="photo-name"></div>
     <div class="photo-date">📅 ${photo.date}</div>
     <div class="photo-date">🕐 ${photo.time}</div>
     <div class="photo-location">📱 Diunggah dari perangkat</div>
    </div>
   </div>
   <div class="card-actions">
    <button class="download-btn">⬇️ Download Foto</button>
    <button class="delete-btn">🗑️ Hapus Foto</button>
   </div>`;
  card.querySelector(".photo-name").textContent=photo.name;
  card.querySelector(".download-btn").onclick=()=>downloadPhoto(photo);
  card.querySelector(".delete-btn").onclick=()=>deletePhoto(photo.id);
  gallery.appendChild(card);
 });
}

function deletePhoto(id){
 if(!confirm("Yakin ingin menghapus foto ini?"))return;
 let photos=JSON.parse(localStorage.getItem("galeri_photos")||"[]");
 photos=photos.filter(p=>String(p.id)!==String(id));
 localStorage.setItem("galeri_photos",JSON.stringify(photos));
 loadGallery();
}

function downloadPhoto(photo){
 const a=document.createElement("a");
 a.href=photo.image;
 const safeName=(photo.name||"foto-kenangan")
   .replace(/[\\/:*?"<>|]/g,"-")
   .trim();
 a.download=safeName+".jpg";
 document.body.appendChild(a);
 a.click();
 a.remove();
}
