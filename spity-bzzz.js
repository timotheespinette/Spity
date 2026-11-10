/* ===== spity-bzzz.js : menu du jeu Bzzz (avant la partie) =====
   Même écran en ligne (salon) et en local : seul l'appelant change.
   En local, les modes marqués local:false (Choix multiples) ne sont pas affichés. */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Image du bandeau (dossier "jeux" sur GitHub).
   Format conseillé : 2,5 fois plus large que haute (ex. 1500 x 600 px).
   Si l'image n'existe pas : un dégradé jaune s'affiche. */
var BZ_IMAGE = "jeux/bzzz.png";

/* true = le titre « Bzzz » est écrit par-dessus l'image.
   false = ton image contient déjà le titre. */
var BZ_TITRE_SUR_IMAGE = true;

/* Texte du bouton violet à droite */
var BZ_BOUTON_MOT = "Mot";

/* Nombre minimum de joueurs */
var BZ_MIN_JOUEURS = 2;

/* Les modes, dans l'ordre d'affichage (les 3 cartes).
   img     : image de la carte (dossier "jeux"). Si le fichier n'existe pas, un dégradé s'affiche.
   emoji   : affiché au centre quand img est vide ("").
   local   : false = carte cachée en mode local.
   info    : texte du petit « i ». */
var BZ_MODES = [
  {id:"tour", nom:"Chacun son tour", img:"jeux/bzzz-tour.png", emoji:"🎯", couleurs:["#6a4bd6","#2a1470"], local:true,
   info:"Les joueurs (ou les équipes) répondent chacun à leur tour. Une bonne réponse rapporte des points, puis la main passe au suivant."},
  {id:"buzzer", nom:"Buzzer", img:"jeux/bzzz-buzzer.png", emoji:"🔔", couleurs:["#f6c453","#d9822b"], local:true,
   info:"Une question apparaît : le plus rapide à appuyer sur son buzzer gagne le droit de répondre. En cas de mauvaise réponse, les autres peuvent reprendre la main."},
  {id:"qcm", nom:"Choix multiples", img:"jeux/bzzz-qcm.png", emoji:"📝", couleurs:["#2fb86a","#0f6b3b"], local:false,
   info:"Chaque question propose plusieurs réponses sur ton téléphone. Tout le monde répond en même temps : plus tu es rapide, plus tu gagnes de points. Disponible en ligne uniquement, car chacun a besoin de son téléphone."}
];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var root, opts = {}, nb = 0, sel = "", modeJeu = "solo", modes = [];

var st = document.createElement("style");
st.textContent = `
#bzzz{padding:0;overflow-y:auto}
.bzw{position:relative;box-sizing:border-box;width:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(14px,3vh,30px);padding:76px clamp(14px,4vw,44px) 28px}
.bztop{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.bztop:active{transform:scale(.94)}
.bztop svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.bzban{position:relative;flex:none;aspect-ratio:5/2;width:min(100%,900px,calc((100vh - 340px)*2.5));min-width:260px;border-radius:26px;overflow:hidden;border:4px solid rgba(255,255,255,.55);box-shadow:0 12px 30px rgba(0,40,90,.4);background-size:cover;background-position:center;display:grid;place-items:center}
.bzban::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,20,60,.45),transparent 60%);pointer-events:none}
.bztit{position:relative;z-index:1;color:#fff;font-weight:800;font-size:clamp(2.4rem,10vw,6rem);line-height:1;letter-spacing:.04em;text-shadow:0 4px 16px rgba(0,30,80,.75)}
.bzrow{width:min(100%,1000px);display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,.36fr);gap:clamp(12px,2.4vw,28px);align-items:stretch}
.bzmodes{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:clamp(10px,2vw,24px)}
.bzit{position:relative;min-width:0}
.bzc{position:relative;box-sizing:border-box;width:100%;aspect-ratio:4/5;border-radius:24px;overflow:hidden;border:4px solid rgba(255,255,255,.55);box-shadow:0 10px 26px rgba(0,40,90,.4);background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer;color:#fff;transition:transform .15s,border-color .15s}
.bzc:focus-visible,.bzb:focus-visible,.bzi:focus-visible,.bztop:focus-visible{outline:3px solid #fff;outline-offset:3px}
.bzc.sel{border-color:#ffc23d;transform:scale(1.03)}
.bzem{position:absolute;left:0;right:0;top:0;bottom:22%;display:grid;place-items:center;font-size:clamp(3rem,9vw,6rem);pointer-events:none}
.bzl{position:relative;padding:10px 6px 12px;background:rgba(14,22,70,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-weight:800;font-size:clamp(.95rem,2.2vw,1.5rem);line-height:1.1;text-align:center}
.bzi{position:absolute;top:10px;right:10px;z-index:2;width:34px;height:34px;padding:0;border-radius:50%;background:var(--glass);border:1.5px solid var(--line);color:#fff;font-weight:800;font-size:1.1rem;font-style:italic}
.bzside{display:flex;flex-direction:column;justify-content:center;gap:clamp(14px,3vh,28px)}
.bzb{display:flex;align-items:center;justify-content:center;padding:18px 10px 20px;border:0;border-radius:24px;font:inherit;font-weight:800;font-size:clamp(1.3rem,3vw,2rem);line-height:1.1;cursor:pointer;transition:transform .1s,box-shadow .1s}
.bzb:active{transform:translateY(7px);box-shadow:0 0 0 transparent!important}
.bzb-v{background:linear-gradient(180deg,#9170ff,#7a57f5);color:#fff;box-shadow:0 7px 0 #3f26a8}
.bzb-m{background:linear-gradient(180deg,#5bf0d3,#34d9bc);color:#082a24;box-shadow:0 7px 0 #14917c}
.bzb:disabled{filter:grayscale(.7) brightness(.8);cursor:not-allowed}
.bzmodal{display:none;position:fixed;inset:0;z-index:20;background:rgba(0,20,60,.6);place-items:center;padding:20px}
.bzmodal.on{display:grid}
.bzmbox{width:min(92vw,520px);box-sizing:border-box;padding:22px 26px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px}
.bzmt{font-weight:800;font-size:2rem;line-height:1.05}
.bzmd{line-height:1.4}
.bztoast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);transform:translate(-50%,10px);opacity:0;pointer-events:none;z-index:30;max-width:90vw;background:#fff;color:#150b36;padding:10px 18px;border-radius:14px;font-weight:600;text-align:center;transition:opacity .25s,transform .25s}
.bztoast.on{opacity:1;transform:translate(-50%,0)}
@media (max-width:700px){
.bzrow{grid-template-columns:1fr}
.bzside{flex-direction:row}
.bzside .bzb{flex:1}
.bzc{aspect-ratio:3/4}
}
`;
document.head.appendChild(st);

function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function q(i){return root.querySelector("#"+i)}

function toast(msg){
  var t=root.querySelector(".bztoast");
  t.textContent=msg;t.classList.add("on");
  clearTimeout(toast.id);toast.id=setTimeout(function(){t.classList.remove("on")},2200)}

/* Sélection d'un mode */
function choisir(id){
  sel=id;
  [].forEach.call(root.querySelectorAll(".bzc"),function(c){
    var on=c.dataset.id===id;
    c.classList.toggle("sel",on);c.setAttribute("aria-checked",on)})}

/* Fenêtre d'explication (le petit « i ») */
function info(m){
  var b=q("bzM");
  b.querySelector(".bzmt").textContent=m.nom;
  b.querySelector(".bzmd").textContent=m.info||"";
  b.classList.add("on")}
function fermer(){q("bzM").classList.remove("on")}

function demarrer(){
  if(nb>0&&nb<BZ_MIN_JOUEURS)return toast("Il faut au moins "+BZ_MIN_JOUEURS+" joueurs.");
  var cfg={mode:sel,equipes:modeJeu==="equipes"};
  opts.demarrer?opts.demarrer(cfg):toast("Bientôt : la partie sera ajoutée à l’étape suivante.")}

function mot(){
  opts.mot?opts.mot(sel):toast("Bientôt : cet écran sera ajouté à l’étape suivante.")}

/* Appelé quand la liste des joueurs change */
function joueurs(l){
  nb=l?l.length:0;
  if(root)q("bzGo").disabled=nb>0&&nb<BZ_MIN_JOUEURS}

/* Appelé par le salon quand on arrive sur le menu : "solo", "equipes" ou "direct" */
function ouvrir(mode){modeJeu=(mode==="equipes")?"equipes":"solo"}

function init(r,o){
  root=r;opts=o||{};
  modes=BZ_MODES.filter(function(m){return !(opts.local&&m.local===false)});
  if(!modes.length)return;
  if(!sel||!modes.some(function(m){return m.id===sel}))sel=modes[0].id;
  root.innerHTML=
    '<div class="bzw">'+
      '<button class="bztop" id="bzBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
      '<div class="bzban" id="bzBan" role="img" aria-label="Bzzz">'+(BZ_TITRE_SUR_IMAGE?'<div class="bztit">Bzzz</div>':'')+'</div>'+
      '<div class="bzrow">'+
        '<div class="bzmodes" id="bzModes" role="radiogroup" aria-label="Mode de jeu"></div>'+
        '<div class="bzside">'+
          '<button class="bzb bzb-v" id="bzMot"></button>'+
          '<button class="bzb bzb-m" id="bzGo">Démarrer</button>'+
        '</div>'+
      '</div>'+
      '<div class="bzmodal" id="bzM"><div class="bzmbox glass"><div class="bzmt"></div><div class="bzmd"></div><button class="btn" id="bzMx">Fermer</button></div></div>'+
      '<div class="bztoast" role="status" aria-live="polite"></div>'+
    '</div>';
  var g="linear-gradient(135deg,#f6c453,#d9822b)";
  q("bzBan").style.backgroundImage=(BZ_IMAGE?'url("'+BZ_IMAGE+'"),':"")+g;
  q("bzMot").textContent=BZ_BOUTON_MOT;

  var box=q("bzModes");
  box.style.setProperty("--n",modes.length);
  modes.forEach(function(m){
    var it=h("div","bzit"),c=h("div","bzc"+(m.id===sel?" sel":""));
    c.dataset.id=m.id;c.tabIndex=0;
    c.setAttribute("role","radio");c.setAttribute("aria-checked",m.id===sel);
    c.style.backgroundImage=(m.img?'url("'+m.img+'"),':"")+"linear-gradient(135deg,"+m.couleurs[0]+","+m.couleurs[1]+")";
    if(!m.img&&m.emoji)c.appendChild(h("div","bzem",m.emoji));
    c.appendChild(h("div","bzl",m.nom));
    c.onclick=function(){choisir(m.id)};
    c.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();choisir(m.id)}};
    var i=h("button","bzi","i");
    i.setAttribute("aria-label","Informations : "+m.nom);
    i.onclick=function(e){e.stopPropagation();info(m)};
    it.appendChild(c);it.appendChild(i);box.appendChild(it)});

  q("bzBack").onclick=function(){opts.retour&&opts.retour()};
  q("bzMot").onclick=mot;
  q("bzGo").onclick=demarrer;
  q("bzMx").onclick=fermer;
  q("bzM").onclick=function(e){if(e.target===this)fermer()};
  joueurs(nb?new Array(nb):null)}

window.Bzzz={init:init,ouvrir:ouvrir,joueurs:joueurs,choix:function(){return{mode:sel,equipes:modeJeu==="equipes"}}};
})();
