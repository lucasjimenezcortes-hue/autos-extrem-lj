const grid=document.getElementById("vehicle-grid");
const empty=document.getElementById("empty-state");
const search=document.getElementById("search");
const fuel=document.getElementById("fuel");
const sort=document.getElementById("sort");
document.getElementById("year").textContent=new Date().getFullYear();

function euro(n){
 return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
}

let activeGallery=[];
let activePhoto=0;
let lastGalleryTrigger=null;

const lightbox=document.createElement("div");
lightbox.className="photo-lightbox";
lightbox.id="photo-lightbox";
lightbox.setAttribute("role","dialog");
lightbox.setAttribute("aria-modal","true");
lightbox.setAttribute("aria-label","Galería de fotografías del vehículo");
lightbox.innerHTML=`
 <div class="lightbox-panel">
  <div class="lightbox-top">
   <span class="lightbox-count" id="lightbox-count"></span>
   <button class="lightbox-close" type="button" aria-label="Cerrar galería">×</button>
  </div>
  <div class="lightbox-stage">
   <button class="lightbox-arrow lightbox-prev" type="button" aria-label="Fotografía anterior">‹</button>
   <img class="lightbox-image" id="lightbox-image" alt="Fotografía ampliada del vehículo">
   <button class="lightbox-arrow lightbox-next" type="button" aria-label="Fotografía siguiente">›</button>
  </div>
  <div class="lightbox-thumbs" id="lightbox-thumbs" aria-label="Elegir fotografía"></div>
 </div>`;
document.body.appendChild(lightbox);

const lightboxImage=lightbox.querySelector("#lightbox-image");
const lightboxCount=lightbox.querySelector("#lightbox-count");
const thumbs=lightbox.querySelector("#lightbox-thumbs");

function showPhoto(index){
 if(!activeGallery.length)return;
 activePhoto=(index+activeGallery.length)%activeGallery.length;
 lightboxImage.src=activeGallery[activePhoto];
 lightboxCount.textContent=`FOTOGRAFÍA ${activePhoto+1} DE ${activeGallery.length}`;
 [...thumbs.children].forEach((button,i)=>{
  button.classList.toggle("active",i===activePhoto);
  button.setAttribute("aria-current",i===activePhoto?"true":"false");
 });
 const current=thumbs.children[activePhoto];
 if(current)current.scrollIntoView({block:"nearest",inline:"center"});
}

function openGallery(gallery,trigger){
 activeGallery=gallery;
 activePhoto=0;
 lastGalleryTrigger=trigger;
 thumbs.innerHTML="";
 gallery.forEach((src,i)=>{
  const button=document.createElement("button");
  button.type="button";
  button.className="lightbox-thumb";
  button.setAttribute("aria-label",`Ver fotografía ${i+1}`);
  button.innerHTML=`<img src="${src}" alt="">`;
  button.addEventListener("click",()=>showPhoto(i));
  thumbs.appendChild(button);
 });
 lightbox.classList.add("open");
 document.body.classList.add("gallery-open");
 showPhoto(0);
 lightbox.querySelector(".lightbox-close").focus();
}

function closeGallery(){
 lightbox.classList.remove("open");
 document.body.classList.remove("gallery-open");
 lightboxImage.removeAttribute("src");
 if(lastGalleryTrigger)lastGalleryTrigger.focus();
}
lightbox.querySelector(".lightbox-close").addEventListener("click",closeGallery);
lightbox.querySelector(".lightbox-prev").addEventListener("click",()=>showPhoto(activePhoto-1));
lightbox.querySelector(".lightbox-next").addEventListener("click",()=>showPhoto(activePhoto+1));
lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeGallery()});
document.addEventListener("keydown",e=>{
 if(!lightbox.classList.contains("open"))return;
 if(e.key==="Escape")closeGallery();
 if(e.key==="ArrowLeft")showPhoto(activePhoto-1);
 if(e.key==="ArrowRight")showPhoto(activePhoto+1);
});

let vehicles=[];

function render(){
 let list=[...vehicles];
 const q=search.value.trim().toLowerCase();
 if(q)list=list.filter(v=>(v.brand+" "+v.model).toLowerCase().includes(q));
 if(fuel.value)list=list.filter(v=>v.fuel===fuel.value);
 if(sort.value==="price-up")list.sort((a,b)=>a.price-b.price);
 if(sort.value==="price-down")list.sort((a,b)=>b.price-a.price);
 grid.innerHTML="";
 list.forEach(v=>{
  const card=document.createElement("article");
  card.className="vehicle-card";
  const gallery=(v.gallery&&v.gallery.length)?v.gallery:(v.image?[v.image]:[]);
  const photo=gallery[0]?`<img src="${gallery[0]}" alt="${v.brand} ${v.model}" loading="lazy">`:"FOTOGRAFÍA DEL VEHÍCULO";
  const details=[v.year||"",v.km?Number(v.km).toLocaleString("es-ES")+" km":"",v.fuel||"",v.transmission||""].filter(Boolean).join(" · ");
  const msg=encodeURIComponent(`Hola, estoy interesado/a en el ${v.brand} ${v.model}. ¿Me podéis dar más información?`);
  const priceLabel=(typeof v.price==="number"&&v.price>0)?euro(v.price):"Consultar precio";
  card.innerHTML=`
   <button class="vehicle-photo" type="button" aria-label="Ver fotografías del ${v.brand} ${v.model}">
    ${photo}
    <span class="photo-overlay">⌕ VER FOTOGRAFÍAS (${gallery.length})</span>
   </button>
   <div class="vehicle-info">
    <h3>${v.brand} ${v.model}</h3>
    <div class="vehicle-meta">${details||"Consulta más información"}</div>
    <div class="vehicle-price">${priceLabel}</div>
    <div class="vehicle-actions">
     <button class="gallery-button" type="button">VER TODAS LAS FOTOS (${gallery.length})</button>
     <a href="https://wa.me/34617469025?text=${msg}" target="_blank" rel="noopener">SOLICITAR INFORMACIÓN ↗</a>
    </div>
   </div>`;
  const openButtons=card.querySelectorAll(".vehicle-photo,.gallery-button");
  openButtons.forEach(button=>button.addEventListener("click",()=>openGallery(gallery,button)));
  grid.appendChild(card);
 });
 empty.style.display=list.length?"none":"block";
}
[search,fuel,sort].forEach(el=>el.addEventListener("input",render));
const toggle=document.querySelector(".menu-toggle"),nav=document.querySelector(".nav");
toggle.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",open?"true":"false")});
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
fetch("data/vehicles.json")
 .then(response=>{if(!response.ok)throw new Error("No se pudo cargar el catálogo");return response.json()})
 .then(data=>{vehicles=Array.isArray(data)?data:(Array.isArray(data.vehicles)?data.vehicles:[]);render()})
 .catch(error=>{console.error(error);vehicles=[];render()});

