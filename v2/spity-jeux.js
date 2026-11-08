/* ===== spity-jeux.js : écran de choix du jeu (côté hôte) ===== */

/* 1) LES JEUX : une ligne par jeu, dans l’ordre d’affichage.
   fond    : nom de l’image de la carte, par exemple "jeux/undersea.png".
             Laisse "" tant que l’image n’existe pas : la carte affiche un dégradé ("couleurs").
   equipes : true = au clic sur la carte, les boutons Solo / Équipes apparaissent.
   dispo   : false = carte grisée avec « Bientôt ». */
var JEUX=[
  {id:"undersea", nom:"UnderSea", sous:"Undercover", fond:"jeux/undersea.png", couleurs:["#1fb6e8","#0a5ea8"], dispo:true, equipes:false, local:true, min:3, max:20,
   info:"Chacun reçoit un mot en secret. Les civils ont tous le même mot, l’undercover en a un très proche. Décris le tien sans le dire, puis votez pour démasquer l’intrus."},
  {id:"quizebre", nom:"Qui-Zèbre ?", sous:"Quiz TV", fond:"", couleurs:["#f6c453","#d9822b"], dispo:true, equipes:true, local:true, min:2, max:20,
   info:"Questions, buzzer et QCM : réponds vite et juste depuis ton téléphone, seul ou en équipes."},
  {id:"manoir", nom:"Le Manoir", sous:"", fond:"", couleurs:["#2fb86a","#0f6b3b"], dispo:true, equipes:false, local:false, min:2, max:20,
   info:"Description à venir."},
  {id:"battest", nom:"Bat-Test", sous:"Blindtest", fond:"", couleurs:["#6a4bd6","#2a1470"], dispo:false, equipes:true, local:true, min:2, max:20,
   info:"Reconnais la chanson le plus vite possible, seul ou en équipes."},
  {id:"hasard", nom:"Pile ou Phoque", sous:"Jeu au hasard", fond:"", couleurs:["#9ee3ff","#3f8fc4"], dispo:true, hasard:true,
   info:"Un jeu et un mode (solo ou équipes) tirés au hasard."}
];

/* 2) Code (ne pas toucher) */
(function(){
var root,opts={},sel="",list=[];

var st=document.createElement("style");
st.textContent=
"#games{grid-template-areas:'l c r';grid-template-columns:minmax(0,1fr) minmax(0,min(58vw,1000px)) minmax(0,1fr);grid-template-rows:minmax(0,1fr);gap:0 clamp(8px,2vw,28px);padding-top:70px}"+
"#gL{grid-area:l}#gC{grid-area:c}#gR{grid-area:r}"+
".gtop{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}"+
".gtop:active{transform:scale(.94)}"+
".gtop svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"+
"#gBack{left:16px}#gMap{right:16px}#gScores{right:78px}"+
".gside{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;align-items:flex-start;gap:calc(var(--s,70px)*.3) calc(var(--s,70px)*.2);min-width:0;min-height:0}"+
".gp{display:flex;flex-direction:column;align-items:center;gap:3px}"+
".gside .av{width:var(--s,70px);border-width:3px}"+
".gside .nm{font-size:.7rem;padding:1px 8px;max-width:calc(var(--s,70px)*1.5)}"+
".nonm .nm{display:none}"+
".gcol{height:100%;min-height:0;overflow-y:auto;scroll-snap-type:y proximity;scroll-padding-top:5vh;padding:5vh 4px 40vh;display:flex;flex-direction:column;gap:3.5vh;scrollbar-width:none;-webkit-overflow-scrolling:touch}"+
".gcol::-webkit-scrollbar{display:none}"+
".gitem{flex:none;scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;width:100%}"+
".gcard{position:relative;height:min(46vh,26vw);aspect-ratio:2/1;border-radius:26px;overflow:hidden;cursor:pointer;border:4px solid rgba(255,255,255,.55);box-shadow:0 12px 30px rgba(0,40,90,.4);background-size:cover;background-position:center;color:#fff;transition:transform .15s,border-color .15s}"+
".gcard::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,20,60,.7),transparent 55%);pointer-events:none}"+
".gcard:focus-visible{outline:3px solid #fff;outline-offset:3px}"+
".gitem.sel .gcard{border-color:#ffc23d;transform:scale(1.02)}"+
".gcard.off{filter:grayscale(.6) brightness(.8)}"+
".gtxt{position:absolute;left:5%;bottom:7%;z-index:1;text-align:left}"+
".gtitle{font-weight:800;font-size:clamp(1.5rem,5.5vh,3.6rem);line-height:1;text-shadow:0 3px 12px rgba(0,30,80,.7)}"+
".gsous{font-weight:600;font-size:clamp(.8rem,2.2vh,1.3rem);opacity:.92;text-shadow:0 2px 8px rgba(0,30,80,.7)}"+
".gsoon{position:absolute;top:10px;left:10px;z-index:2;padding:3px 12px;border-radius:999px;background:var(--glass);border:1.5px solid var(--line);font-weight:800;font-size:.85rem}"+
".gi{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;padding:0;border-radius:50%;background:var(--glass);border:1.5px solid var(--line);color:#fff;font-weight:800;font-size:1.1rem;font-style:italic}"+
".gbar{display:none;gap:14px;margin-top:14px;justify-content:center}"+
".gitem.sel .gbar{display:flex}"+
".gbar .btn{padding:10px 30px 12px;font-size:1.25rem}"+
".gmodal{display:none;position:fixed;inset:0;z-index:20;background:rgba(0,20,60,.6);place-items:center;padding:20px}"+
".gmodal.on{display:grid}"+
".gmbox{width:min(92vw,520px);box-sizing:border-box;padding:22px 26px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}"+
".gmt{font-weight:800;font-size:2rem;line-height:1.05}"+
".gms{opacity:.85;font-weight:600}"+
".gmd{line-height:1.35}"+
".gml{white-space:pre-line;font-weight:600;opacity:.9}"+
"@media (max-aspect-ratio:1/1){"+
"#games{grid-template-areas:'l r' 'c c';grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);gap:8px 12px}"+
".gcard{height:auto;width:100%;max-width:560px}}";
document.head.appendChild(st);

function bientot(){opts.bientot&&opts.bientot()}
function go(j,mode){opts.choisir?opts.choisir(j,mode):bientot()}
function fermer(){document.getElementById("gM").classList.remove("on")}

function info(j){
  var m=document.getElementById("gM"),rows=[];
  m.querySelector(".gmt").textContent=j.nom;
  m.querySelector(".gms").textContent=j.sous||"";
  m.querySelector(".gmd").textContent=j.info||"";
  if(!j.hasard){
    if(j.min&&j.max)rows.push("Joueurs : "+j.min+" à "+j.max);
    rows.push("Équipes : "+(j.equipes?"oui":"non"));
    rows.push("Mode local : "+(j.local?"oui":"non"))}
  m.querySelector(".gml").textContent=rows.join("\n");
  m.classList.add("on")}

function hasard(){
  var l=JEUX.filter(function(j){return j.dispo!==false&&!j.hasard});
  if(!l.length)return bientot();
  var j=l[Math.floor(Math.random()*l.length)];
  go(j,j.equipes?(Math.random()<.5?"solo":"equipes"):"direct")}

function choisir(j,it){
  if(j.dispo===false)return bientot();
  if(j.hasard)return hasard();
  if(j.equipes){
    var was=sel===j.id;sel=was?"":j.id;
    [].forEach.call(root.querySelectorAll(".gitem"),function(x){x.classList.toggle("sel",x===it&&!was)});
    return}
  go(j,"direct")}

function carte(j){
  var it=document.createElement("div"),c=document.createElement("div"),t=document.createElement("div"),a=document.createElement("div"),i=document.createElement("button");
  it.className="gitem";
  c.className="gcard"+(j.dispo===false?" off":"");c.tabIndex=0;c.setAttribute("role","button");
  var g="linear-gradient(135deg,"+(j.couleurs?j.couleurs[0]:"#1fb6e8")+","+(j.couleurs?j.couleurs[1]:"#0a5ea8")+")";
  c.style.backgroundImage=(j.fond?'url("'+j.fond+'"),':"")+g;
  t.className="gtxt";a.className="gtitle";a.textContent=j.nom;t.appendChild(a);
  if(j.sous){var b=document.createElement("div");b.className="gsous";b.textContent=j.sous;t.appendChild(b)}
  c.appendChild(t);
  if(j.dispo===false){var s=document.createElement("div");s.className="gsoon";s.textContent="Bientôt";c.appendChild(s)}
  i.className="gi";i.textContent="i";i.setAttribute("aria-label","Informations : "+j.nom);
  i.onclick=function(e){e.stopPropagation();info(j)};c.appendChild(i);
  c.onclick=function(){choisir(j,it)};
  c.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choisir(j,it)}};
  it.appendChild(c);
  if(j.equipes){
    var bar=document.createElement("div");bar.className="gbar";
    ["solo","equipes"].forEach(function(m){
      var bt=document.createElement("button");bt.className="btn"+(m==="equipes"?" sun":"");
      bt.textContent=m==="solo"?"Solo":"Équipes";bt.onclick=function(){go(j,m)};bar.appendChild(bt)});
    it.appendChild(bar)}
  return it}

/* Taille des avatars sur les côtés : plus il y a de joueurs, plus ils sont petits */
function taille(){
  if(!root)return;
  var n=list.length,per=Math.max(1,Math.ceil(n/2)),w=innerWidth,h=innerHeight,land=w>h,s;
  var W=land?(w-Math.min(w*.58,1000))/2-30:w/2-24,H=land?h-120:h*.26;
  for(s=110;s>34;s-=4){if(Math.floor(W/(s*1.3))*Math.floor(H/(s*1.6))>=per)break}
  root.style.setProperty("--s",s+"px");
  root.classList.toggle("nonm",s<56)}

function joueurs(l){
  list=l||[];
  var L=document.getElementById("gL"),R=document.getElementById("gR");
  if(!L||!R)return;
  L.innerHTML="";R.innerHTML="";
  list.forEach(function(p,i){
    var d=document.createElement("div"),n=document.createElement("div");
    d.className="gp";n.className="nm";n.textContent=p.name;
    d.appendChild(Avatar.make(p));d.appendChild(n);(i%2?R:L).appendChild(d)});
  taille()}

function init(r,o){
  root=r;opts=o||{};
  root.innerHTML=
    '<button class="gtop" id="gBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
    '<button class="gtop" id="gScores" aria-label="Scores" title="Scores"><svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M5 3h14v10a7 7 0 0 1-14 0zM5 6H2v3a4 4 0 0 0 4 4M19 6h3v3a4 4 0 0 1-4 4"/></svg></button>'+
    '<button class="gtop" id="gMap" aria-label="Carte des jeux"><svg viewBox="0 0 24 24"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg></button>'+
    '<div class="gside" id="gL"></div><div class="gcol" id="gC"></div><div class="gside" id="gR"></div>'+
    '<div class="gmodal" id="gM"><div class="gmbox glass"><div class="gmt"></div><div class="gms"></div><div class="gmd"></div><div class="gml"></div><button class="btn" id="gMx">Fermer</button></div></div>';
  var c=document.getElementById("gC");
  JEUX.forEach(function(j){c.appendChild(carte(j))});
  document.getElementById("gBack").onclick=function(){opts.retour&&opts.retour()};
  document.getElementById("gMap").onclick=bientot;
  document.getElementById("gScores").onclick=function(){
  window.location.href="spity-scores.js";
};
  document.getElementById("gMx").onclick=fermer;
  document.getElementById("gM").onclick=function(e){if(e.target===this)fermer()};
  addEventListener("resize",taille);
  joueurs(list)}

window.Jeux={init:init,joueurs:joueurs};
})();
