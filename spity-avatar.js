/* ===== spity-avatar.js : avatars, contours, accessoires + possession ===== */

/* 1) CATALOGUE : une ligne par objet
   type   = "contour" ou "acc"
   theme  = ce que tu veux (jungle, mer, feu, fête, animaux…) : les filtres de la boutique se créent tout seuls
   rarete = "commun" | "rare" | "epique" | "legendaire"
   base   = true → offert dès le départ (toujours possédé, prix ignoré) */
var CATALOGUE=[
  {id:"moustache", type:"acc",     nom:"Moustache", img:"acc/moustache.png",     prix:0,   theme:"fête",   rarete:"commun",     base:true},
  {id:"plage",     type:"contour", nom:"Plage",     img:"contours/plage.png",    prix:0,   theme:"mer",    rarete:"commun",     base:true},
  {id:"panda",     type:"contour", nom:"Panda",     img:"contours/panda.png",    prix:40,  theme:"jungle", rarete:"rare"},
  {id:"flamme",    type:"contour", nom:"Flamme",    img:"contours/flamme.png",   prix:50,  theme:"feu",    rarete:"epique"},
  {id:"creator",   type:"contour", nom:"Creator",   img:"contours/creator.png",  prix:100, theme:"fête",   rarete:"legendaire"}
];
var PIECES_DEPART=10; /* pièces données au tout premier lancement */

/* 2) Code (ne pas toucher) */
(function(){
var FISH="spity-poisson-face.png",mine={contour:"",acc:""};
try{var sv=JSON.parse(localStorage.getItem("spity-equipe"));if(sv){mine.contour=sv.contour||"";mine.acc=sv.acc||""}}catch(e){}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

/* --- Possession (localStorage, partagé par toutes les pages du site) --- */
function lire(){try{return JSON.parse(localStorage.getItem("spity-possedes"))||[]}catch(e){return[]}}
function cle(it){return it.type+":"+it.id}
function possede(it){return !!it&&(!!it.base||lire().indexOf(cle(it))>-1)}
function pieces(){var n=parseInt(localStorage.getItem("spity-pieces"),10);return isNaN(n)?PIECES_DEPART:n}
function gagner(n){try{localStorage.setItem("spity-pieces",String(Math.max(0,pieces()+n)))}catch(e){}}
function acheter(it){
  if(possede(it))return"deja";
  if(pieces()<it.prix)return"pas-assez";
  var l=lire();l.push(cle(it));
  try{localStorage.setItem("spity-possedes",JSON.stringify(l))}catch(e){return"erreur"}
  gagner(-it.prix);return"ok"}

var st=document.createElement("style");
st.textContent=
".avw{position:relative;width:fit-content}"+
".av{position:relative}"+
".av img.ac,.av.d img.ac{position:absolute;inset:0;width:100%;height:100%;padding:0;object-fit:cover}"+
".cf{position:absolute;left:50%;top:50%;width:140%;height:140%;transform:translate(-50%,-50%);pointer-events:none}"+
".apk-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:26vh;overflow-y:auto;padding:6px}"+
".apk-tile{position:relative;width:64px;height:64px;padding:4px;border-radius:16px;display:grid;place-items:center;font-size:1.6rem;background:rgba(14,22,70,.42);border:2px solid rgba(255,255,255,.32);color:#fff;cursor:pointer}"+
".apk-tile img{width:100%;height:100%;object-fit:contain}"+
".apk-tile.sel{border-color:#ffc23d;box-shadow:0 0 0 3px #ffc23d}"+
".apk-tile.lock{cursor:not-allowed}.apk-tile.lock img{opacity:.35;filter:grayscale(1)}"+
".apk-tile.lock::after{content:'🔒';position:absolute;right:2px;bottom:0;font-size:1rem}";
document.head.appendChild(st);

function item(id,type){for(var i=0;i<CATALOGUE.length;i++)if(CATALOGUE[i].id===id&&CATALOGUE[i].type===type)return CATALOGUE[i];return null}
function valid(s){return typeof s==="string"&&s.indexOf("data:image/")===0||s===FISH?s:""}
function layer(cls,src){var x=document.createElement("img");x.className=cls;x.src=src;x.alt="";x.onerror=function(){this.remove()};return x}

/* Dessine un avatar : o = {avatar, ring, contour, acc} */
function make(o){
  var w=document.createElement("div"),a=document.createElement("div"),i=document.createElement("img");
  w.className="avw";a.className="av"+(valid(o.avatar)?"":" d");
  a.style.setProperty("--ring",/^#[0-9a-f]{3,6}$/i.test(o.ring)?o.ring:"#fff");
  i.src=valid(o.avatar)||FISH;i.alt="";a.appendChild(i);
  var ac=item(o.acc,"acc");if(ac)a.appendChild(layer("ac",ac.img));
  w.appendChild(a);
  var co=item(o.contour,"contour");if(co)w.appendChild(layer("cf",co.img));
  return w}

/* Écran de choix : onglets + grille, construits dans l'élément root */
function picker(root,onChange){
  var tab="contour",tabs=document.createElement("div"),g=document.createElement("div"),bC=btn("Contour"),bA=btn("Accessoire");
  function btn(t){var b=document.createElement("button");b.className="btn";b.textContent=t;return b}
  tabs.className="two";g.className="apk-grid";
  tabs.appendChild(bC);tabs.appendChild(bA);root.appendChild(tabs);root.appendChild(g);
  function pick(id){mine[tab]=id;try{localStorage.setItem("spity-equipe",JSON.stringify(mine))}catch(e){}draw();onChange&&onChange()}
  function draw(){
    bC.classList.toggle("sun",tab==="contour");bA.classList.toggle("sun",tab==="acc");g.innerHTML="";
    /* sécurité : si l'objet équipé n'est plus possédé, on l'enlève */
    if(mine[tab]&&!possede(item(mine[tab],tab)))mine[tab]="";
    var none=document.createElement("button");none.className="apk-tile"+(mine[tab]?"":" sel");none.textContent="∅";none.setAttribute("aria-label","Aucun");
    none.onclick=function(){pick("")};g.appendChild(none);
    CATALOGUE.forEach(function(it){if(it.type!==tab)return;
      var own=possede(it),b=document.createElement("button"),im=document.createElement("img");
      b.className="apk-tile"+(mine[tab]===it.id?" sel":"")+(own?"":" lock");
      b.setAttribute("aria-label",it.nom+(own?"":" (à acheter dans le magasin)"));b.title=own?it.nom:it.nom+" — à acheter";
      im.src=it.img;im.alt="";b.appendChild(im);
      b.onclick=function(){if(own)pick(it.id)};g.appendChild(b)})}
  bC.onclick=function(){tab="contour";draw()};
  bA.onclick=function(){tab="acc";draw()};
  draw()}

window.Avatar={make:make,picker:picker,mine:mine,catalogue:CATALOGUE,item:item,
  possede:possede,pieces:pieces,gagner:gagner,acheter:acheter};
})();
