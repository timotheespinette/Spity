/* ===== spity-avatar.js : avatars, contours, accessoires ===== */

/* 1) CATALOGUE : une ligne par objet (id unique ; type = "contour" ou "acc") */
var CATALOGUE=[
  {id:"moustache", type:"acc", nom:"Moustache", img:"acc/moustache.png", prix:20},
  {id:"creator", type:"contour", nom:"creator", img:"contours/creator.png", prix:100},
  {id:"flamme", type:"contour", nom:"flamme", img:"contours/flamme.png", prix:50},
  {id:"plage", type:"contour", nom:"plage", img:"contours/plage.png", prix:10}
];

/* 2) Code (ne pas toucher) */
(function(){
var FISH="spity-poisson-face.png",mine={contour:"",acc:""};

var st=document.createElement("style");
st.textContent=
".avw{position:relative;width:fit-content}"+
".av{position:relative}"+
".av img.ac,.av.d img.ac{position:absolute;inset:0;width:100%;height:100%;padding:0;object-fit:cover}"+
".cf{position:absolute;left:50%;top:50%;width:140%;height:140%;transform:translate(-50%,-50%);pointer-events:none}"+
".apk-grid{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-height:26vh;overflow-y:auto;padding:6px}"+
".apk-tile{width:64px;height:64px;padding:4px;border-radius:16px;display:grid;place-items:center;font-size:1.6rem;background:rgba(14,22,70,.42);border:2px solid rgba(255,255,255,.32);color:#fff;cursor:pointer}"+
".apk-tile img{width:100%;height:100%;object-fit:contain}"+
".apk-tile.sel{border-color:#ffc23d;box-shadow:0 0 0 3px #ffc23d}";
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
  function pick(id){mine[tab]=id;draw();onChange&&onChange()}
  function draw(){
    bC.classList.toggle("sun",tab==="contour");bA.classList.toggle("sun",tab==="acc");g.innerHTML="";
    var none=document.createElement("button");none.className="apk-tile"+(mine[tab]?"":" sel");none.textContent="∅";none.setAttribute("aria-label","Aucun");
    none.onclick=function(){pick("")};g.appendChild(none);
    CATALOGUE.forEach(function(it){if(it.type!==tab)return;
      var b=document.createElement("button"),im=document.createElement("img");
      b.className="apk-tile"+(mine[tab]===it.id?" sel":"");b.setAttribute("aria-label",it.nom);
      im.src=it.img;im.alt="";b.appendChild(im);b.onclick=function(){pick(it.id)};g.appendChild(b)})}
  bC.onclick=function(){tab="contour";draw()};
  bA.onclick=function(){tab="acc";draw()};
  draw()}

window.Avatar={make:make,picker:picker,mine:mine,catalogue:CATALOGUE,item:item};
})();
