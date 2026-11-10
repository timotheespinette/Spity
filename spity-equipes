/* ===== spity-equipes.js : menu Équipes (même écran en local et en ligne) =====
   Reçoit la liste des joueurs, les répartit en équipes, puis rend la main avec les équipes choisies. */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Nombre d'équipes par défaut (un jeu peut les changer avec eqMin / eqMax dans JEUX) */
var EQ_MIN_DEFAUT = 2;
var EQ_MAX_DEFAUT = 6;

/* Avatars d'équipe : emoji affiché par défaut, ou image PNG (dossier "jeux" sur GitHub).
   Mets le nom d'une image dans img (ex. "jeux/equipe-requin.png") ; si elle est vide
   ou introuvable, l'emoji s'affiche. Touche l'avatar d'une équipe pour en changer. */
var EQ_AVATARS = [
  {emoji:"🐠", img:""},
  {emoji:"🦈", img:""},
  {emoji:"🐙", img:""},
  {emoji:"🐬", img:""},
  {emoji:"🦀", img:""},
  {emoji:"🐢", img:""}
];

/* Couleur de chaque équipe (dans l'ordre des colonnes) */
var EQ_COULEURS = ["#ff7a59","#7a57f5","#34d9bc","#ffc23d","#ff6fa8","#4fc3f7"];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var root, opts = {}, jeu = null, joueurs = [], equipes = [], sel = "", compteur = 0, dernier = null;

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function q(i){return root.querySelector("#"+i)}
function msg(t){opts.toast && opts.toast(t)}
function trouver(id){for(var i=0;i<joueurs.length;i++)if(joueurs[i].id===id)return joueurs[i];return null}

var st = document.createElement("style");
st.textContent =
"#equipes{padding:0;overflow-y:auto}"+
".eqw{box-sizing:border-box;min-height:100%;width:100%;display:flex;flex-direction:column;align-items:center;gap:14px;padding:70px clamp(14px,4vw,44px) 120px}"+
".eqback{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}"+
".eqback:active{transform:scale(.94)}"+
".eqback svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}"+
".eqtit{padding:4px clamp(36px,9vw,110px) 8px}"+
".eqtit h2{font-size:clamp(1.8rem,5vw,3rem)}"+
".eqnb{display:flex;align-items:center;gap:16px}"+
".eqbtn{width:48px;height:48px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:1.7rem;line-height:1}"+
".eqbtn:active{transform:scale(.92)}"+
".eqbtn:disabled{opacity:.3;cursor:not-allowed}"+
".eqn{min-width:1.6em;font-weight:800;font-size:2rem;text-align:center}"+
".eqaide{min-height:1.3em;font-weight:600;text-align:center;text-shadow:0 2px 8px rgba(0,40,90,.5)}"+
".eqgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:12px;width:min(100%,1100px);align-items:stretch}"+
".eqcol{--c:#fff;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:10px;min-height:200px;border:3px solid var(--c);cursor:pointer}"+
".eqcol.cible{box-shadow:0 0 0 3px rgba(255,255,255,.35)}"+
".eqhd{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:2px solid var(--c)}"+
".eqav{width:52px;height:52px;flex:none;padding:0;border-radius:50%;background:rgba(255,255,255,.2);border:3px solid var(--c);overflow:hidden;font-size:1.7rem;line-height:1}"+
".eqface{width:100%;height:100%;display:grid;place-items:center}"+
".eqface img{width:100%;height:100%;object-fit:contain}"+
".eqnom{min-width:0;flex:1;width:100%;box-sizing:border-box;padding:6px 8px;border:0;border-radius:12px;background:rgba(255,255,255,.92);color:#12264d;font:inherit;font-weight:800;font-size:1.05rem;text-align:center;outline:0}"+
".eqnom:focus{box-shadow:0 0 0 3px #fff8}"+
".eqmb{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-content:flex-start;flex:1}"+
".eqp{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px;border-radius:16px;background:none;border:2px solid transparent}"+
".eqp.on{border-color:#ffc23d;background:rgba(255,194,61,.25)}"+
".eqp .av{width:clamp(44px,8vh,70px);border-width:3px}"+
".eqp .nm{font-size:.75rem;padding:1px 8px;max-width:90px}"+
".eqgo{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);z-index:4}"+
".eqback:focus-visible,.eqbtn:focus-visible,.eqav:focus-visible,.eqp:focus-visible,.eqgo:focus-visible{outline:3px solid #fff;outline-offset:3px}";
document.head.appendChild(st);

/* ----- Données ----- */
function bornes(){
  var mn=(jeu&&jeu.eqMin)||EQ_MIN_DEFAUT, mx=(jeu&&jeu.eqMax)||EQ_MAX_DEFAUT;
  mx=Math.min(mx,joueurs.length);
  return{min:mn,max:Math.max(mn,mx)}}

function nouvelleEquipe(){
  var i=equipes.length,n=EQ_AVATARS.length,used=equipes.map(function(e){return e.av}),av=i%n;
  for(var k=0;k<n;k++){var c=(i+k)%n;if(used.indexOf(c)<0){av=c;break}}
  equipes.push({id:"e"+(++compteur),nom:"Équipe "+(i+1),av:av,membres:[]})}

/* Chaque joueur dans une seule équipe ; les nouveaux vont dans l'équipe la moins remplie */
function repartir(){
  var ids=joueurs.map(function(p){return p.id}),vus={};
  equipes.forEach(function(e){
    e.membres=e.membres.filter(function(id){
      if(ids.indexOf(id)<0||vus[id])return false;
      vus[id]=1;return true})});
  joueurs.forEach(function(p){
    if(vus[p.id])return;
    var m=equipes[0];
    equipes.forEach(function(e){if(e.membres.length<m.membres.length)m=e});
    m.membres.push(p.id);vus[p.id]=1})}

function nombre(d){
  var b=bornes(),n=equipes.length+d;
  if(n<b.min||n>b.max)return;
  if(d>0)nouvelleEquipe();else equipes.pop();      /* les joueurs de l'équipe retirée sont redistribués */
  sel="";repartir();dessiner()}

function deplacer(id,eid){
  equipes.forEach(function(e){e.membres=e.membres.filter(function(x){return x!==id})});
  equipes.forEach(function(e){if(e.id===eid)e.membres.push(id)});
  sel="";dessiner()}

function suivantAvatar(e){
  var n=EQ_AVATARS.length,used=equipes.filter(function(x){return x!==e}).map(function(x){return x.av});
  for(var k=1;k<=n;k++){var c=(e.av+k)%n;if(used.indexOf(c)<0)return c}
  return e.av}

/* ----- Affichage ----- */
function avatarEquipe(i){
  var a=EQ_AVATARS[i],d=h("div","eqface");
  function emo(){d.innerHTML="";d.appendChild(h("span","",a.emoji))}
  if(!a.img)emo();
  else{var im=new Image();im.alt="";im.onerror=emo;im.src=a.img;d.appendChild(im)}
  return d}

function dessiner(){
  if(!root)return;
  var b=bornes();
  q("eqN").textContent=equipes.length;
  q("eqMoins").disabled=equipes.length<=b.min;
  q("eqPlus").disabled=equipes.length>=b.max;
  q("eqAide").textContent=sel?"Touche l’équipe où le placer.":"Touche un joueur, puis l’équipe où le placer.";
  var g=q("eqGrid");g.innerHTML="";
  equipes.forEach(function(e,i){
    var col=h("div","eqcol glass"+(sel?" cible":""));
    col.style.setProperty("--c",EQ_COULEURS[i%EQ_COULEURS.length]);
    var hd=h("div","eqhd");
    var av=h("button","eqav");av.setAttribute("aria-label","Changer l’avatar de "+e.nom);
    av.appendChild(avatarEquipe(e.av));
    av.onclick=function(ev){ev.stopPropagation();e.av=suivantAvatar(e);dessiner()};
    var inp=h("input","eqnom");inp.value=e.nom;inp.maxLength=14;inp.autocomplete="off";
    inp.setAttribute("aria-label","Nom de l’équipe "+(i+1));
    inp.oninput=function(){e.nom=inp.value};
    inp.onclick=function(ev){ev.stopPropagation()};
    hd.appendChild(av);hd.appendChild(inp);col.appendChild(hd);
    var mb=h("div","eqmb");
    e.membres.forEach(function(id){
      var p=trouver(id);if(!p)return;
      var bt=h("button","eqp"+(sel===id?" on":""));
      bt.appendChild(Avatar.make(p));bt.appendChild(h("div","nm",p.name));
      bt.onclick=function(ev){ev.stopPropagation();sel=(sel===id)?"":id;dessiner()};
      mb.appendChild(bt)});
    col.appendChild(mb);
    col.onclick=function(){if(sel)deplacer(sel,e.id)};
    g.appendChild(col)})}

/* ----- Validation ----- */
function demarrer(){
  var noms={},i,e,nom;
  for(i=0;i<equipes.length;i++){
    e=equipes[i];nom=(e.nom||"").trim()||("Équipe "+(i+1));
    if(!e.membres.length)return msg("Chaque équipe doit avoir au moins un joueur ("+nom+" est vide).");
    if(noms[nom.toLowerCase()])return msg("Deux équipes ont le même nom.");
    noms[nom.toLowerCase()]=1}
  dernier=equipes.map(function(e,i){
    var a=EQ_AVATARS[e.av];
    return{id:e.id,nom:(e.nom||"").trim()||("Équipe "+(i+1)),emoji:a.emoji,img:a.img,
      couleur:EQ_COULEURS[i%EQ_COULEURS.length],joueurs:e.membres.slice()}});
  opts.demarrer && opts.demarrer(dernier,jeu)}

/* ----- API ----- */
/* Ouvre le menu pour une liste de joueurs et un jeu. Renvoie false si on ne peut pas faire d'équipes. */
function ouvrir(l,j){
  jeu=j||null;joueurs=l||[];
  var mn=(jeu&&jeu.eqMin)||EQ_MIN_DEFAUT;
  if(joueurs.length<mn){msg("Il faut au moins "+mn+" joueurs pour jouer en équipes.");return false}
  var b=bornes();
  while(equipes.length<b.min)nouvelleEquipe();
  while(equipes.length>b.max)equipes.pop();
  repartir();sel="";dessiner();return true}

/* En ligne : appelé quand la liste des joueurs change (quelqu'un arrive ou part) */
function maj(l){
  joueurs=l||[];
  if(!root||!equipes.length)return;
  repartir();
  if(sel&&!trouver(sel))sel="";
  dessiner()}

function init(r,o){
  root=r;opts=o||{};
  root.innerHTML=
    '<div class="eqw">'+
      '<button class="eqback" id="eqBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
      '<div class="eqtit glass"><h2>Équipes</h2></div>'+
      '<div class="eqnb"><button class="eqbtn" id="eqPlus" aria-label="Ajouter une équipe">+</button><span class="eqn" id="eqN"></span><button class="eqbtn" id="eqMoins" aria-label="Retirer une équipe">−</button></div>'+
      '<div class="eqaide" id="eqAide" role="status"></div>'+
      '<div class="eqgrid" id="eqGrid"></div>'+
      '<button class="btn sun eqgo" id="eqGo">Démarrer</button>'+
    '</div>';
  q("eqBack").onclick=function(){opts.retour && opts.retour()};
  q("eqPlus").onclick=function(){nombre(1)};
  q("eqMoins").onclick=function(){nombre(-1)};
  q("eqGo").onclick=demarrer;
  dessiner()}

window.Equipes={init:init,ouvrir:ouvrir,joueurs:maj,resultat:function(){return dernier}};
})();
