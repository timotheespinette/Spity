/* ===== manoir-menu.js : menu de Caméléon avant la partie (rôles + paramètres) =====
   Les réglages sont enregistrés sur l'appareil de l'hôte. */

/* 1) À MODIFIER ICI  ----------------------------------------------------- */

/* Titre affiché en haut du menu */
var MM_TITRE = "Caméléon";

/* Les 11 rôles.
   camp  : "cultiste" ou "invite"
   fixe  : true = toujours présent (le Cultiste complète les cultistes, l'Innocent complète les invités)
   info  : true = rôle d'information (leur nombre est limité selon le nombre de joueurs) */
var MM_ROLES = [
  {id:"cultiste",     nom:"Le Cultiste",       emoji:"🔪", camp:"cultiste", fixe:true,
   desc:"Attaque au contact. Seul à pouvoir utiliser les trappes."},
  {id:"empoisonneur", nom:"L’Empoisonneur",    emoji:"🧪", camp:"cultiste",
   desc:"Sa cible meurt 15 secondes plus tard, sans être prévenue."},
  {id:"metamorphe",   nom:"Le Métamorphe",     emoji:"🎭", camp:"cultiste",
   desc:"Copie la couleur et le pseudo d’un joueur proche pendant 10 secondes."},
  {id:"innocent",     nom:"L’Innocent",        emoji:"🕯️", camp:"invite", fixe:true,
   desc:"Fait ses missions, surveille les autres et signale les cadavres."},
  {id:"detective",    nom:"Le Détective",      emoji:"🔍", camp:"invite", info:true,
   desc:"Vision infrarouge : voit les empreintes de pas récentes."},
  {id:"medium",       nom:"Le Médium",         emoji:"🔮", camp:"invite", info:true,
   desc:"Reçoit un flash rouge à l’instant exact de chaque mort."},
  {id:"garde",        nom:"Le Garde du corps", emoji:"🛡️", camp:"invite",
   desc:"Protège un joueur avec un bouclier de 20 secondes."},
  {id:"veilleur",     nom:"Le Veilleur",       emoji:"👁️", camp:"invite", info:true,
   desc:"Voit les deux caméras sur son téléphone, mais ne peut pas bouger."},
  {id:"chasseur",     nom:"Le Chasseur",       emoji:"🏹", camp:"invite",
   desc:"S’il est éliminé au vote, il peut tuer un joueur en 5 secondes."},
  {id:"cartographe",  nom:"Le Cartographe",    emoji:"🗺️", camp:"invite", info:true,
   desc:"Révèle la position de tous les joueurs pendant 5 secondes."},
  {id:"martyr",       nom:"Le Martyr",         emoji:"🩸", camp:"invite",
   desc:"S’il est assassiné, il déclenche l’alarme et une réunion."}
];

/* Les paramètres réglables : k = nom interne, def = valeur de départ, pas = pas du + et du −.
   zero = texte affiché quand la valeur est 0. */
var MM_PARAMS = [
  {k:"vitesse",     nom:"Vitesse de déplacement",       min:2,  max:5,   pas:.5, def:3,  unite:" cases/s"},
  {k:"rayonVision", nom:"Rayon de vision",              min:3,  max:8,   pas:1,  def:5,  unite:" cases"},
  {k:"cooldownKill",nom:"Délai entre deux attaques",    min:10, max:60,  pas:5,  def:25, unite:" s"},
  {k:"missions",    nom:"Missions par joueur",          min:3,  max:6,   pas:1,  def:4,  unite:""},
  {k:"discussion",  nom:"Durée de la discussion",       min:15, max:120, pas:15, def:45, unite:" s"},
  {k:"vote",        nom:"Durée du vote",                min:10, max:60,  pas:5,  def:20, unite:" s"},
  {k:"cloche",      nom:"Cloches d’urgence par joueur", min:0,  max:3,   pas:1,  def:1,  unite:""},
  {k:"sabotage",    nom:"Délai entre deux sabotages",   min:20, max:90,  pas:5,  def:40, unite:" s"},
  {k:"minuteur",    nom:"Minuteur de partie",           min:0,  max:30,  pas:5,  def:0,  unite:" min", zero:"Aucun"}
];

/* Les options oui / non */
var MM_OPTIONS = [
  {k:"reveler", nom:"Révéler le camp d’un joueur éliminé", def:false}
];

/* 2) Code (ne pas toucher) ---------------------------------------------- */
(function(){
var LS = "spity-manoir-cfg";
var root, opts = {}, nb = 0, onglet = "roles", cfg;

/* ----- Réglages enregistrés ----- */
function defaut(){
  var c={roles:{},params:{},options:{}};
  MM_ROLES.forEach(function(r){c.roles[r.id]=true});
  MM_PARAMS.forEach(function(p){c.params[p.k]=p.def});
  MM_OPTIONS.forEach(function(o){c.options[o.k]=o.def});
  return c}

function charger(){
  var c=defaut();
  try{
    var v=JSON.parse(localStorage.getItem(LS));
    if(v&&typeof v==="object"){
      MM_ROLES.forEach(function(r){if(v.roles&&typeof v.roles[r.id]==="boolean")c.roles[r.id]=v.roles[r.id]});
      MM_PARAMS.forEach(function(p){
        var x=v.params&&v.params[p.k];
        if(typeof x==="number"&&x>=p.min&&x<=p.max)c.params[p.k]=x});
      MM_OPTIONS.forEach(function(o){if(v.options&&typeof v.options[o.k]==="boolean")c.options[o.k]=v.options[o.k]})}
  }catch(e){}
  return c}

function sauver(){try{localStorage.setItem(LS,JSON.stringify(cfg))}catch(e){}}

/* ----- Outils ----- */
function h(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function q(i){return root.querySelector("#"+i)}
function copie(o){return JSON.parse(JSON.stringify(o))}
function bouton(txt,cls,fn){var b=h("button","btn "+(cls||""),txt);b.type="button";b.onclick=fn;return b}

function toast(msg){
  var t=root.querySelector(".mmtoast");
  t.textContent=msg;t.classList.add("on");
  clearTimeout(toast.id);toast.id=setTimeout(function(){t.classList.remove("on")},2200)}

/* Limites du cahier des règles (§2) selon le nombre de joueurs */
function limites(n){
  var c=n<=10?(n<=6?1:2):(n===11?2:3),i=n<=6?1:(n<=10?2:3);
  return{cult:Math.min(c,Math.floor(n/2)),info:i}}

function resume(){
  if(!nb)return"Le nombre de cultistes et de rôles d’information dépend du nombre de joueurs.";
  var l=limites(nb);
  return"Avec "+nb+" joueurs : "+l.cult+" cultiste"+(l.cult>1?"s":"")+
    " · "+l.info+" rôle"+(l.info>1?"s":"")+" d’information au maximum"}

function aff(p,v){
  if(p.zero&&v===0)return p.zero;
  return String(v).replace(".",",")+p.unite}

/* La configuration envoyée à la partie */
function sortie(){
  return{
    roles:MM_ROLES.filter(function(r){return r.fixe||cfg.roles[r.id]}).map(function(r){return r.id}),
    params:copie(cfg.params),
    options:copie(cfg.options)}}

/* ----- Interface ----- */
var st=document.createElement("style");
st.textContent=`
#mnMenu{padding:0;overflow-y:auto}
.mmw{box-sizing:border-box;min-height:100%;width:100%;display:flex;flex-direction:column;align-items:center;gap:16px;padding:76px clamp(14px,4vw,44px) 28px}
.mmback{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);left:16px;z-index:3;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--glass);border:1.5px solid var(--line);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.mmback:active{transform:scale(.94)}
.mmback svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mmtitle{margin:0;font-weight:800;font-size:clamp(2rem,7vw,4rem);line-height:1;letter-spacing:.03em;text-shadow:0 4px 16px rgba(0,30,80,.6)}
.mmtabs{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.mmtab{padding:10px 26px 12px;font-size:1.2rem}
.mmpanel{width:min(100%,1000px);display:flex;flex-direction:column;align-items:stretch;gap:12px}
.mmsum{padding:10px 18px;text-align:center;font-weight:700}
.mmh{margin:8px 0 0;font-weight:800;font-size:1.5rem;text-shadow:0 3px 12px rgba(0,40,90,.5)}
.mmgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.mmr{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:18px;background:var(--glass);border:2px solid var(--line);color:#fff;text-align:left;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.mmr.on{border-color:#ffc23d;background:rgba(255,194,61,.2)}
.mmr.off{opacity:.55}
.mmr:disabled{cursor:default;color:#fff}
.mmr:not(:disabled):active{transform:scale(.98)}
.mme{flex:none;font-size:2.2rem;line-height:1;width:2.4rem;text-align:center}
.mmn{font-weight:800;font-size:1.1rem}
.mmd{font-weight:600;font-size:.9rem;opacity:.92;line-height:1.25}
.mmf{margin-top:2px;font-weight:700;font-size:.75rem;opacity:.8}
.mmlist{display:flex;flex-direction:column;gap:8px}
.mmp{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 14px;border-radius:16px;background:rgba(255,255,255,.12);border:1.5px solid var(--line)}
.mml{font-weight:800}
.mmst{display:flex;align-items:center;gap:10px;flex:none}
.mmb{width:44px;height:44px;padding:0;border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:1.6rem;line-height:1}
.mmb:active{transform:scale(.92)}
.mmb:disabled{opacity:.3;cursor:not-allowed}
.mmv{min-width:5.2em;font-weight:800;font-size:1.15rem;text-align:center}
.mmsw{min-width:84px;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.2);font-weight:800}
.mmsw.on{background:#34d9bc;color:#082a24}
.mmsm{align-self:center;padding:8px 20px 10px;font-size:1rem}
.mmw .btn:disabled{filter:grayscale(.7) brightness(.8);cursor:not-allowed}
.mmback:focus-visible,.mmr:focus-visible,.mmb:focus-visible,.mmsw:focus-visible{outline:3px solid #fff;outline-offset:3px}
.mmtoast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 24px);transform:translate(-50%,10px);opacity:0;pointer-events:none;z-index:30;max-width:90vw;background:#fff;color:#150b36;padding:10px 18px;border-radius:14px;font-weight:600;text-align:center;transition:opacity .25s,transform .25s}
.mmtoast.on{opacity:1;transform:translate(-50%,0)}
`;
document.head.appendChild(st);

function panneauRoles(pn){
  pn.appendChild(h("div","mmsum glass",resume()));
  [["cultiste","Cultistes"],["invite","Invités"]].forEach(function(g){
    pn.appendChild(h("h3","mmh",g[1]));
    var grid=h("div","mmgrid");
    MM_ROLES.filter(function(r){return r.camp===g[0]}).forEach(function(r){
      var on=r.fixe||cfg.roles[r.id];
      var b=h("button","mmr"+(on?" on":" off"));
      b.type="button";b.setAttribute("aria-pressed",on);
      b.appendChild(h("div","mme",r.emoji));
      var t=h("div","mmt");
      t.appendChild(h("div","mmn",r.nom));
      t.appendChild(h("div","mmd",r.desc));
      if(r.fixe)t.appendChild(h("div","mmf","Toujours présent"));
      else if(r.info)t.appendChild(h("div","mmf","Rôle d’information"));
      b.appendChild(t);
      if(r.fixe)b.disabled=true;
      else b.onclick=function(){cfg.roles[r.id]=!cfg.roles[r.id];sauver();dessiner()};
      grid.appendChild(b)});
    pn.appendChild(grid)})}

function pas(p,d){
  var v=cfg.params[p.k]+d*p.pas;
  cfg.params[p.k]=Math.round(Math.max(p.min,Math.min(p.max,v))*100)/100;
  sauver();dessiner()}

function panneauParams(pn){
  var box=h("div","mmlist");
  MM_PARAMS.forEach(function(p){
    var v=cfg.params[p.k],row=h("div","mmp");
    row.appendChild(h("div","mml",p.nom));
    var s=h("div","mmst"),m=h("button","mmb","−"),pl=h("button","mmb","+");
    m.type=pl.type="button";
    m.setAttribute("aria-label","Moins : "+p.nom);pl.setAttribute("aria-label","Plus : "+p.nom);
    m.disabled=v<=p.min;pl.disabled=v>=p.max;
    m.onclick=function(){pas(p,-1)};pl.onclick=function(){pas(p,1)};
    s.appendChild(m);s.appendChild(h("span","mmv",aff(p,v)));s.appendChild(pl);
    row.appendChild(s);box.appendChild(row)});
  MM_OPTIONS.forEach(function(o){
    var row=h("div","mmp"),on=cfg.options[o.k];
    row.appendChild(h("div","mml",o.nom));
    var b=h("button","mmsw"+(on?" on":""),on?"Oui":"Non");
    b.type="button";b.setAttribute("aria-pressed",on);
    b.onclick=function(){cfg.options[o.k]=!cfg.options[o.k];sauver();dessiner()};
    row.appendChild(b);box.appendChild(row)});
  pn.appendChild(box);
  var rz=bouton("Valeurs par défaut","",function(){
    var d=defaut();cfg.params=d.params;cfg.options=d.options;sauver();dessiner()});
  rz.classList.add("mmsm");pn.appendChild(rz)}

function dessiner(){
  if(!root)return;
  var top=root.scrollTop,pn=q("mmPanel");
  pn.innerHTML="";
  [].forEach.call(root.querySelectorAll(".mmtab"),function(b){b.classList.toggle("sun",b.dataset.t===onglet)});
  if(onglet==="roles")panneauRoles(pn);else panneauParams(pn);
  q("mmGo").disabled=nb>0&&nb<(window.MN_MIN_JOUEURS||4);
  root.scrollTop=top}

function demarrer(){
  var min=window.MN_MIN_JOUEURS||4;
  if(nb>0&&nb<min)return toast("Il faut au moins "+min+" joueurs.");
  opts.demarrer?opts.demarrer(sortie()):toast("Bientôt : la partie sera ajoutée à l’étape suivante.")}

/* Appelé par le salon quand la liste des joueurs change ou quand on ouvre le menu */
function joueurs(l){
  nb=l?l.length:0;
  if(root)dessiner()}

function init(r,o){
  root=r;opts=o||{};cfg=charger();
  root.innerHTML=
    '<div class="mmw">'+
      '<button class="mmback" id="mmBack" aria-label="Retour"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>'+
      '<h2 class="mmtitle"></h2>'+
      '<div class="mmtabs">'+
        '<button class="btn mmtab" data-t="roles">Rôles</button>'+
        '<button class="btn mmtab" data-t="params">Paramètres</button>'+
      '</div>'+
      '<div class="mmpanel" id="mmPanel"></div>'+
      '<button class="btn sun" id="mmGo">Démarrer</button>'+
      '<div class="mmtoast" role="status" aria-live="polite"></div>'+
    '</div>';
  root.querySelector(".mmtitle").textContent=MM_TITRE;
  q("mmBack").onclick=function(){opts.retour&&opts.retour()};
  [].forEach.call(root.querySelectorAll(".mmtab"),function(b){
    b.onclick=function(){onglet=b.dataset.t;dessiner()}});
  q("mmGo").onclick=demarrer;
  dessiner()}

window.ManoirMenu={init:init,joueurs:joueurs,config:function(){return sortie()}};
})();
